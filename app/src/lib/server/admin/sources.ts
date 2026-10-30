import type { DatabaseSync } from 'node:sqlite';
import { redactUrl } from '../sync/git';
import { parseSchedule } from '../sync/schedule';
import type { SourceFields, StoredSourceFields } from '#lib/source-fields.js';
import { encryptToken } from '../token-encryption';
import { m } from '#lib/paraglide/messages.js';
import { isSlug, MAX_NAME_LENGTH, MAX_SLUG_LENGTH, slugify } from '../../slug';

/** A new slug, and the current one typed again to show the admin knows what changes. */
export interface SlugChangeForm {
	slug: string;
	confirmation: string;
}

/** A source as the management area may show it: the access token is reduced to whether there is one. */
export interface SourceSettings extends StoredSourceFields {
	id: number;
	slug: string;
	hasToken: boolean;
}

export interface SourceForm extends SourceFields {
	/** Empty keeps the stored token. */
	token: string;
	removeToken: boolean;
}

export type SaveResult = { id: number } | { error: string };

function nameProblem(name: string): string | undefined {
	if (!name.trim()) return m.error_name_missing();
	if (name.trim().length > MAX_NAME_LENGTH) return m.error_name_too_long({ max: MAX_NAME_LENGTH });
	return undefined;
}

/** Why the slug cannot become `form.slug`; undefined when it can. */
function slugChangeProblem(
	current: string,
	form: SlugChangeForm,
	taken: (slug: string) => boolean
): string | undefined {
	if (form.confirmation.trim() !== current) return m.error_slug_confirmation({ slug: current });
	const slug = form.slug.trim();
	if (!isSlug(slug)) return m.error_slug_rule({ max: MAX_SLUG_LENGTH });
	if (slug === current) return m.error_slug_unchanged();
	if (taken(slug)) return m.error_slug_taken({ slug });
	return undefined;
}

interface SourceRow {
	id: number;
	slug: string;
	name: string;
	description: string;
	git_url: string;
	docs_url: string | null;
	branch: string;
	path: string;
	exclusions: string;
	sync_schedule: string | null;
	paused: number;
	public: number;
	username: string | null;
	has_token: number;
}

const SOURCE_COLUMNS = `id, slug, name, description, git_url, docs_url, branch, path, exclusions, sync_schedule, paused,
	public, username, encrypted_token IS NOT NULL AS has_token`;

function toSettings(row: SourceRow): SourceSettings {
	return {
		id: row.id,
		slug: row.slug,
		name: row.name,
		description: row.description,
		gitUrl: redactUrl(row.git_url),
		docsUrl: row.docs_url,
		branch: row.branch,
		path: row.path,
		exclusions: JSON.parse(row.exclusions) as string[],
		schedule: row.sync_schedule,
		paused: row.paused === 1,
		public: row.public === 1,
		username: row.username,
		hasToken: row.has_token === 1
	};
}

export function listSources(db: DatabaseSync): SourceSettings[] {
	const rows = db
		.prepare(`SELECT ${SOURCE_COLUMNS} FROM sources ORDER BY slug`)
		.all() as unknown as SourceRow[];
	return rows.map(toSettings);
}

export function findSource(db: DatabaseSync, sourceId: number): SourceSettings | undefined {
	const row = db.prepare(`SELECT ${SOURCE_COLUMNS} FROM sources WHERE id = ?`).get(sourceId) as
		SourceRow | undefined;
	return row && toSettings(row);
}

function sourceSlugTaken(db: DatabaseSync, slug: string, sourceId: number | undefined): boolean {
	return (
		db
			.prepare('SELECT 1 FROM sources WHERE slug = ? AND id IS NOT ?')
			.get(slug, sourceId ?? null) !== undefined
	);
}

/**
 * Why the source cannot be saved like this; undefined when it can. A new source takes its slug
 * from the name; an existing one keeps its slug.
 */
export function sourceProblem(
	db: DatabaseSync,
	sourceId: number | undefined,
	form: SourceForm
): string | undefined {
	const nameIssue = nameProblem(form.name);
	if (nameIssue) return nameIssue;
	if (sourceId === undefined) {
		const slug = slugify(form.name);
		if (!slug) return m.error_slug_empty();
		if (sourceSlugTaken(db, slug, undefined)) return m.error_source_slug_taken({ slug });
	}

	const remoteIssue = remoteProblem(db, sourceId, form);
	if (remoteIssue) return remoteIssue;

	const docsUrlProblem = checkDocsUrl(form.docsUrl.trim());
	if (docsUrlProblem) return docsUrlProblem;

	if (!form.branch.trim()) return m.error_branch();

	const path = form.path.trim();
	if (path.startsWith('/') || path.split('/').includes('..')) {
		return m.error_path();
	}

	const schedule = form.schedule.trim();
	if (schedule) {
		try {
			parseSchedule(schedule);
		} catch (error) {
			// The detail comes from the cron parser and stays English.
			return m.error_schedule({ detail: (error as Error).message });
		}
	}

	return undefined;
}

/** What grimoire sends to the Git server of a source: its URL, branch and credentials. */
export interface StoredAccess {
	gitUrl: string;
	branch: string;
	username: string | null;
	encryptedToken: string | null;
}

/** The stored access of a source; undefined for a new one. */
export function storedAccess(
	db: DatabaseSync,
	sourceId: number | undefined
): StoredAccess | undefined {
	if (sourceId === undefined) return undefined;
	return db
		.prepare(
			`SELECT git_url AS gitUrl, branch, username, encrypted_token AS encryptedToken
			FROM sources WHERE id = ?`
		)
		.get(sourceId) as StoredAccess | undefined;
}

/**
 * Why grimoire must not contact the Git server in `form`; undefined when it may. Checked before
 * saving and before every access test, which sends the stored token along.
 */
export function remoteProblem(
	db: DatabaseSync,
	sourceId: number | undefined,
	form: SourceForm
): string | undefined {
	const gitUrl = form.gitUrl.trim();
	const urlProblem = checkGitUrl(gitUrl);
	if (urlProblem) return urlProblem;

	const previous = storedAccess(db, sourceId);
	// A stored token goes to whatever server the URL names; moving it to another one needs the
	// admin to enter it again, so a changed URL cannot carry it off unnoticed.
	if (
		previous?.encryptedToken &&
		!form.token.trim() &&
		!form.removeToken &&
		new URL(previous.gitUrl).origin !== new URL(gitUrl).origin
	) {
		return m.error_token_other_server();
	}
	return undefined;
}

/**
 * Creates a source when `sourceId` is undefined, otherwise updates it. A new token
 * is stored encrypted with `key`; an empty one keeps the stored token unless `removeToken` is set.
 */
export function saveSource(
	db: DatabaseSync,
	key: Buffer,
	sourceId: number | undefined,
	form: SourceForm
): SaveResult {
	const problem = sourceProblem(db, sourceId, form);
	if (problem) return { error: problem };

	const name = form.name.trim();
	const gitUrl = form.gitUrl.trim();
	const branch = form.branch.trim();
	const path = form.path.trim();
	const schedule = form.schedule.trim() || null;
	const token = form.token.trim();
	const values = {
		name,
		description: form.description.trim(),
		git_url: gitUrl,
		docs_url: form.docsUrl.trim() || null,
		branch,
		path,
		exclusions: JSON.stringify(
			form.exclusions
				.split('\n')
				.map((line) => line.trim())
				.filter(Boolean)
		),
		sync_schedule: schedule,
		paused: form.paused ? 1 : 0,
		public: form.public ? 1 : 0,
		username: form.username.trim() || null
	};
	const encryptedToken = token ? encryptToken(token, key) : null;

	if (sourceId === undefined) {
		const result = db
			.prepare(
				`INSERT INTO sources (slug, name, description, git_url, docs_url, branch, path,
					exclusions, sync_schedule, paused, public, username, encrypted_token)
				VALUES (:slug, :name, :description, :git_url, :docs_url, :branch, :path,
					:exclusions, :sync_schedule, :paused, :public, :username, :encrypted_token)`
			)
			.run({
				...values,
				slug: slugify(name),
				encrypted_token: encryptedToken
			});
		return { id: Number(result.lastInsertRowid) };
	}
	const { changes } = db
		.prepare(
			`UPDATE sources SET name = :name, description = :description, git_url = :git_url,
			docs_url = :docs_url, branch = :branch, path = :path,
			exclusions = :exclusions, sync_schedule = :sync_schedule, paused = :paused,
			public = :public, username = :username
		WHERE id = :id`
		)
		.run({ ...values, id: sourceId });
	if (changes === 0) throw new Error(`there is no source ${sourceId}`);
	if (token || form.removeToken) {
		db.prepare('UPDATE sources SET encrypted_token = ? WHERE id = ?').run(encryptedToken, sourceId);
	}
	return { id: sourceId };
}

/** Changes the slug of a source, and with it every ID of its pages. */
export function changeSourceSlug(
	db: DatabaseSync,
	sourceId: number,
	form: SlugChangeForm
): SaveResult | 'not-found' {
	const source = findSource(db, sourceId);
	if (!source) return 'not-found';
	const problem = slugChangeProblem(source.slug, form, (slug) =>
		sourceSlugTaken(db, slug, sourceId)
	);
	if (problem) return { error: problem };
	db.prepare('UPDATE sources SET slug = ? WHERE id = ?').run(form.slug.trim(), sourceId);
	return { id: sourceId };
}

function checkGitUrl(gitUrl: string): string | undefined {
	let url: URL;
	try {
		url = new URL(gitUrl);
	} catch {
		return m.error_git_url();
	}
	if (url.protocol !== 'https:') return m.error_git_url_https();
	if (url.username || url.password) {
		return m.error_git_url_credentials();
	}
	return undefined;
}

// The URL ends up in `href`: only web addresses pass, never `javascript:` or a relative path, and
// no credentials, which the link would show to everyone in the management area.
function checkDocsUrl(docsUrl: string): string | undefined {
	if (!docsUrl) return undefined;
	let url: URL;
	try {
		url = new URL(docsUrl);
	} catch {
		return m.error_docs_url();
	}
	if (url.protocol !== 'https:' && url.protocol !== 'http:') return m.error_docs_url();
	if (url.username || url.password) return m.error_docs_url_credentials();
	return undefined;
}

export function deleteSource(db: DatabaseSync, sourceId: number) {
	db.prepare('DELETE FROM sources WHERE id = ?').run(sourceId);
}

/** Reads the id from a route parameter: a number, or `'new'` for a form that creates one. */
export function parseIdParam(param: string): number | 'new' | undefined {
	if (param === 'new') return 'new';
	return /^[1-9]\d*$/.test(param) ? Number(param) : undefined;
}
