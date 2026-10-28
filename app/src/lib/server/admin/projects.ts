import type { DatabaseSync } from 'node:sqlite';
import { redactUrl } from '../sync/git';
import { parseSchedule } from '../sync/schedule';
import { encryptToken } from '../token-encryption';

// Slugs are part of agent IDs and URLs (`<project>/<source>/<page>`), so nothing that needs escaping.
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const SLUG_RULE = 'lowercase letters, digits and single hyphens, e.g. auth-service';

export interface Project {
	id: number;
	slug: string;
	description: string;
}

export interface ProjectForm {
	slug: string;
	description: string;
}

/** A source as the admin area may show it: the access token is reduced to whether there is one. */
export interface SourceSettings {
	id: number;
	slug: string;
	gitUrl: string;
	branch: string;
	path: string;
	exclusions: string[];
	schedule: string | null;
	username: string | null;
	hasToken: boolean;
}

export interface SourceForm {
	slug: string;
	gitUrl: string;
	branch: string;
	path: string;
	/** One glob pattern per line. */
	exclusions: string;
	schedule: string;
	username: string;
	/** Empty keeps the stored token. */
	token: string;
	removeToken: boolean;
}

export type SaveResult = { id: number } | { error: string };

export function listProjects(db: DatabaseSync): Project[] {
	return db
		.prepare('SELECT id, slug, description FROM projects ORDER BY slug')
		.all() as unknown as Project[];
}

export function findProject(db: DatabaseSync, id: number): Project | undefined {
	return db.prepare('SELECT id, slug, description FROM projects WHERE id = ?').get(id) as
		Project | undefined;
}

/** Creates the project when `id` is undefined, otherwise updates it. */
export function saveProject(
	db: DatabaseSync,
	id: number | undefined,
	form: ProjectForm
): SaveResult {
	const slug = form.slug.trim();
	if (!SLUG.test(slug)) return { error: `The slug may contain ${SLUG_RULE}.` };
	const taken = db
		.prepare('SELECT 1 FROM projects WHERE slug = ? AND id IS NOT ?')
		.get(slug, id ?? null);
	if (taken) return { error: `A project with the slug "${slug}" already exists.` };

	const description = form.description.trim();
	if (id === undefined) {
		const result = db
			.prepare('INSERT INTO projects (slug, description) VALUES (?, ?)')
			.run(slug, description);
		return { id: Number(result.lastInsertRowid) };
	}
	db.prepare('UPDATE projects SET slug = ?, description = ? WHERE id = ?').run(
		slug,
		description,
		id
	);
	return { id };
}

/** Deletes the project with its sources and their index. */
export function deleteProject(db: DatabaseSync, id: number) {
	db.prepare('DELETE FROM projects WHERE id = ?').run(id);
}

interface SourceRow {
	id: number;
	slug: string;
	git_url: string;
	branch: string;
	path: string;
	exclusions: string;
	sync_schedule: string | null;
	username: string | null;
	has_token: number;
}

const SOURCE_COLUMNS = `id, slug, git_url, branch, path, exclusions, sync_schedule, username,
	encrypted_token IS NOT NULL AS has_token`;

function toSettings(row: SourceRow): SourceSettings {
	return {
		id: row.id,
		slug: row.slug,
		gitUrl: redactUrl(row.git_url),
		branch: row.branch,
		path: row.path,
		exclusions: JSON.parse(row.exclusions) as string[],
		schedule: row.sync_schedule,
		username: row.username,
		hasToken: row.has_token === 1
	};
}

export function listSources(db: DatabaseSync, projectId: number): SourceSettings[] {
	const rows = db
		.prepare(`SELECT ${SOURCE_COLUMNS} FROM sources WHERE project_id = ? ORDER BY slug`)
		.all(projectId) as unknown as SourceRow[];
	return rows.map(toSettings);
}

export function findSource(
	db: DatabaseSync,
	projectId: number,
	sourceId: number
): SourceSettings | undefined {
	const row = db
		.prepare(`SELECT ${SOURCE_COLUMNS} FROM sources WHERE project_id = ? AND id = ?`)
		.get(projectId, sourceId) as SourceRow | undefined;
	return row && toSettings(row);
}

/**
 * Creates a source of the project when `sourceId` is undefined, otherwise updates it. A new token
 * is stored encrypted with `key`; an empty one keeps the stored token unless `removeToken` is set.
 */
export function saveSource(
	db: DatabaseSync,
	key: Buffer,
	projectId: number,
	sourceId: number | undefined,
	form: SourceForm
): SaveResult {
	const slug = form.slug.trim();
	if (!SLUG.test(slug)) return { error: `The slug may contain ${SLUG_RULE}.` };
	const taken = db
		.prepare('SELECT 1 FROM sources WHERE project_id = ? AND slug = ? AND id IS NOT ?')
		.get(projectId, slug, sourceId ?? null);
	if (taken) return { error: `This project already has a source with the slug "${slug}".` };

	const gitUrl = form.gitUrl.trim();
	const urlProblem = checkGitUrl(gitUrl);
	if (urlProblem) return { error: urlProblem };

	const branch = form.branch.trim();
	if (!branch) return { error: 'Enter the branch.' };

	const path = form.path.trim();
	if (path.startsWith('/') || path.split('/').includes('..')) {
		return { error: 'The path is relative to the repository root and may not contain "..".' };
	}

	const schedule = form.schedule.trim() || null;
	if (schedule) {
		try {
			parseSchedule(schedule);
		} catch (error) {
			return { error: `Schedule: ${(error as Error).message}` };
		}
	}

	const token = form.token.trim();
	const previous =
		sourceId === undefined
			? undefined
			: (db.prepare('SELECT git_url, encrypted_token FROM sources WHERE id = ?').get(sourceId) as
					{ git_url: string; encrypted_token: string | null } | undefined);
	// A stored token goes to whatever server the URL names; moving it to another one needs the
	// admin to enter it again, so a changed URL cannot carry it off unnoticed.
	if (
		previous?.encrypted_token &&
		!token &&
		!form.removeToken &&
		new URL(previous.git_url).origin !== new URL(gitUrl).origin
	) {
		return { error: 'The Git URL points to another server: enter the token again or remove it.' };
	}

	const values = {
		slug,
		git_url: gitUrl,
		branch,
		path,
		exclusions: JSON.stringify(
			form.exclusions
				.split('\n')
				.map((line) => line.trim())
				.filter(Boolean)
		),
		sync_schedule: schedule,
		username: form.username.trim() || null
	};
	const encryptedToken = token ? encryptToken(token, key) : null;

	if (sourceId === undefined) {
		const result = db
			.prepare(
				`INSERT INTO sources (project_id, slug, git_url, branch, path, exclusions, sync_schedule,
					username, encrypted_token)
				VALUES (:project_id, :slug, :git_url, :branch, :path, :exclusions, :sync_schedule,
					:username, :encrypted_token)`
			)
			.run({ ...values, project_id: projectId, encrypted_token: encryptedToken });
		return { id: Number(result.lastInsertRowid) };
	}
	db.prepare(
		`UPDATE sources SET slug = :slug, git_url = :git_url, branch = :branch, path = :path,
			exclusions = :exclusions, sync_schedule = :sync_schedule, username = :username
		WHERE id = :id`
	).run({ ...values, id: sourceId });
	if (token || form.removeToken) {
		db.prepare('UPDATE sources SET encrypted_token = ? WHERE id = ?').run(encryptedToken, sourceId);
	}
	return { id: sourceId };
}

function checkGitUrl(gitUrl: string): string | undefined {
	let url: URL;
	try {
		url = new URL(gitUrl);
	} catch {
		return 'Enter the Git URL, e.g. https://gitlab.example.com/platform/docs.git.';
	}
	if (url.protocol !== 'https:') return 'The Git URL must start with https://.';
	if (url.username || url.password) {
		return 'Enter the username and token in their own fields, not in the Git URL.';
	}
	return undefined;
}

export function deleteSource(db: DatabaseSync, projectId: number, sourceId: number) {
	db.prepare('DELETE FROM sources WHERE project_id = ? AND id = ?').run(projectId, sourceId);
}

/** Reads the id from a route parameter: a number, or `'new'` for a form that creates one. */
export function parseIdParam(param: string): number | 'new' | undefined {
	if (param === 'new') return 'new';
	return /^[1-9]\d*$/.test(param) ? Number(param) : undefined;
}
