import type { DatabaseSync } from 'node:sqlite';
import { toString } from 'mdast-util-to-string';
import type { RootContent } from 'mdast';
import type { ChunkedPage } from '../parsing/chunk';
import type { Link } from '../parsing/links';
import { parseMarkdown } from '../parsing/markdown.ts';
import type { PreprocessedPage } from '../parsing/preprocess';

export interface SyncSource {
	id: number;
	gitUrl: string;
	branch: string;
	path: string;
	exclusions: string[];
	username: string | null;
	encryptedToken: string | null;
	lastCommit: string | null;
}

export interface IndexedPage {
	/** Path relative to the source path, e.g. `deploy.md`. */
	file: string;
	/** Index of the page in the site's `nav`; undefined when it is not listed there. */
	navPosition?: number;
	metadata: PreprocessedPage;
	chunked: ChunkedPage;
}

export interface SourceIndex {
	commit: string;
	pages: IndexedPage[];
	links: Link[];
	warnings: string[];
}

interface SourceRow {
	id: number;
	git_url: string;
	branch: string;
	path: string;
	exclusions: string;
	username: string | null;
	encrypted_token: string | null;
	last_commit: string | null;
}

export interface SourceSchedule {
	id: number;
	/** Cron expression of the source; null for the global default. */
	schedule: string | null;
	lastCheckedAt: Date | null;
}

/**
 * The schedules polling checks; paused sources are left out, and all of them while syncs are
 * paused: `syncsAutomatically` in SQL, for every source at once.
 */
export function listSchedules(db: DatabaseSync): SourceSchedule[] {
	return db
		.prepare(
			`SELECT id, sync_schedule, last_checked_at FROM sources
			WHERE paused = 0 AND NOT (SELECT syncs_paused FROM settings)
			ORDER BY id`
		)
		.all()
		.map((row) => ({
			id: Number(row.id),
			schedule: row.sync_schedule as string | null,
			lastCheckedAt: row.last_checked_at ? new Date(row.last_checked_at as string) : null
		}));
}

/** Records when a source was last asked for new commits, whatever came of it. */
export function recordCheck(db: DatabaseSync, sourceId: number, at: Date) {
	db.prepare('UPDATE sources SET last_checked_at = ? WHERE id = ?').run(at.toISOString(), sourceId);
}

export function sourceForSync(db: DatabaseSync, sourceId: number): SyncSource {
	const row = db
		.prepare(
			`SELECT id, git_url, branch, path, exclusions, username, encrypted_token, last_commit
			FROM sources WHERE id = ?`
		)
		.get(sourceId) as SourceRow | undefined;
	if (!row) throw new Error(`source ${sourceId} does not exist`);
	return {
		id: row.id,
		gitUrl: row.git_url,
		branch: row.branch,
		path: row.path,
		exclusions: JSON.parse(row.exclusions) as string[],
		username: row.username,
		encryptedToken: row.encrypted_token,
		lastCommit: row.last_commit
	};
}

/**
 * Replaces all pages, snippets and links of a source in one transaction, so readers see either
 * the old or the new index, and records the commit as successfully synced.
 */
export function replaceSourceIndex(db: DatabaseSync, sourceId: number, index: SourceIndex) {
	const insertPage = db.prepare(
		`INSERT INTO pages (source_id, file, nav_position, title, description, tags, content)
		VALUES (?, ?, ?, ?, ?, ?, ?)`
	);
	const insertSnippet = db.prepare(
		`INSERT INTO snippets (page_id, position, anchor, aliases, title_path, content, tokens)
		VALUES (?, ?, ?, ?, ?, ?, ?)`
	);
	const insertSearchEntry = db.prepare(
		'INSERT INTO snippets_fts (rowid, title_path, text, code) VALUES (?, ?, ?, ?)'
	);
	const insertLink = db.prepare(
		'INSERT INTO links (page_id, anchor, target, dead) VALUES (?, ?, ?, ?)'
	);
	// Parsed before the write lock is taken, so other connections wait as briefly as possible.
	const searchTexts = index.pages.map(({ chunked }) =>
		chunked.snippets.map((snippet) => splitCode(snippet.content))
	);

	db.exec('BEGIN IMMEDIATE');
	try {
		db.prepare('DELETE FROM pages WHERE source_id = ?').run(sourceId);
		const pageIds = new Map<string, number>();

		for (const [pageIndex, { file, navPosition, metadata, chunked }] of index.pages.entries()) {
			const pageId = Number(
				insertPage.run(
					sourceId,
					file,
					navPosition ?? null,
					chunked.title,
					chunked.description ?? null,
					JSON.stringify(metadata.tags),
					metadata.markdown
				).lastInsertRowid
			);
			pageIds.set(file, pageId);

			chunked.snippets.forEach((snippet, position) => {
				const snippetId = insertSnippet.run(
					pageId,
					position,
					snippet.anchor ?? null,
					JSON.stringify(snippet.aliases),
					JSON.stringify(snippet.titlePath),
					snippet.content,
					snippet.tokens
				).lastInsertRowid;
				const { text, code } = searchTexts[pageIndex][position];
				insertSearchEntry.run(snippetId, snippet.titlePath.join(' › '), text, code);
			});
		}

		for (const link of index.links) {
			insertLink.run(pageIds.get(link.file)!, link.anchor ?? null, link.target, link.dead ? 1 : 0);
		}

		db.prepare(
			`UPDATE sources SET last_commit = ?, last_synced_at = ?, error = NULL, warnings = ?
			WHERE id = ?`
		).run(index.commit, new Date().toISOString(), JSON.stringify(index.warnings), sourceId);
		db.exec('COMMIT');
	} catch (error) {
		if (db.isTransaction) db.exec('ROLLBACK');
		throw error;
	}
}

/** Stores why a sync failed; the index of the last successful sync stays as it is. */
export function recordSyncError(db: DatabaseSync, sourceId: number, message: string) {
	db.prepare('UPDATE sources SET error = ?, last_synced_at = ? WHERE id = ?').run(
		message,
		new Date().toISOString(),
		sourceId
	);
}

/** The source was reachable and is up to date, so an earlier error no longer applies. */
export function clearSyncError(db: DatabaseSync, sourceId: number) {
	db.prepare('UPDATE sources SET error = NULL WHERE id = ?').run(sourceId);
}

/** Separates code blocks from the prose of a snippet, so search can weigh them differently. */
export function splitCode(markdown: string): { text: string; code: string } {
	const nodes = parseMarkdown(markdown).children;
	const isCode = (node: RootContent) => node.type === 'code';
	return {
		text: nodes
			.filter((node) => !isCode(node))
			.map((node) => toString(node))
			.join('\n'),
		code: nodes
			.filter(isCode)
			.map((node) => toString(node))
			.join('\n')
	};
}
