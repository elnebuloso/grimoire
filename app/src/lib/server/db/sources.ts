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

// About 0.15 ms of write lock per snippet: a batch keeps every other writer, the server's
// requests among them, waiting for well under 100 ms however large the source is.
const SNIPPETS_PER_BATCH = 500;
const PAGES_PER_DELETE = 50;

/**
 * Replaces all pages, snippets and links of a source and records the commit as successfully
 * synced. The new index is written in short transactions under the next generation of the source
 * and goes live at once with it, so readers see either the old or the new index; the old one is
 * deleted afterwards, again in short transactions.
 */
export function replaceSourceIndex(
	db: DatabaseSync,
	sourceId: number,
	index: SourceIndex,
	{ snippetsPerBatch = SNIPPETS_PER_BATCH } = {}
) {
	const insertPage = db.prepare(
		`INSERT INTO pages (source_id, generation, file, nav_position, title, description, tags,
			content)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
	);
	const insertSnippet = db.prepare(
		`INSERT INTO snippets (page_id, position, anchor, aliases, title_path, part, parts, content,
			tokens)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
	);
	const insertSearchEntry = db.prepare(
		'INSERT INTO snippets_fts (rowid, title_path, text, code) VALUES (?, ?, ?, ?)'
	);
	const insertLink = db.prepare(
		'INSERT INTO links (page_id, anchor, target, dead) VALUES (?, ?, ?, ?)'
	);
	// Parsed before any write lock is taken, so other connections wait as briefly as possible.
	const pages = index.pages.map((page) => ({
		...page,
		searchTexts: page.chunked.snippets.map((snippet) => splitCode(snippet.content))
	}));

	// What an interrupted sync left behind would collide with the pages written now.
	deleteStalePages(db, sourceId);
	const { generation } = db
		.prepare('SELECT index_generation + 1 AS generation FROM sources WHERE id = ?')
		.get(sourceId) as { generation: number };
	const pageIds = new Map<string, number>();

	const snippetCount = (page: (typeof pages)[number]) => page.chunked.snippets.length;
	for (const batch of batches(pages, snippetCount, snippetsPerBatch)) {
		inTransaction(db, () => {
			for (const { file, navPosition, metadata, chunked, searchTexts } of batch) {
				const pageId = Number(
					insertPage.run(
						sourceId,
						generation,
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
						snippet.part,
						snippet.parts,
						snippet.content,
						snippet.tokens
					).lastInsertRowid;
					const { text, code } = searchTexts[position];
					insertSearchEntry.run(snippetId, snippet.titlePath.join(' › '), text, code);
				});
			}
		});
	}

	for (const batch of batches(index.links, () => 1, snippetsPerBatch)) {
		inTransaction(db, () => {
			for (const link of batch) {
				const pageId = pageIds.get(link.file);
				if (pageId === undefined) throw new Error(`link from unknown page ${link.file}`);
				insertLink.run(pageId, link.anchor ?? null, link.target, link.dead ? 1 : 0);
			}
		});
	}

	db.prepare(
		`UPDATE sources SET index_generation = ?, last_commit = ?, last_synced_at = ?, error = NULL,
			warnings = ?
		WHERE id = ?`
	).run(
		generation,
		index.commit,
		new Date().toISOString(),
		JSON.stringify(index.warnings),
		sourceId
	);
	deleteStalePages(db, sourceId);
}

/** Deletes the pages of a source that are not live, with their snippets and links. */
function deleteStalePages(db: DatabaseSync, sourceId: number) {
	const deleteSome = db.prepare(
		`DELETE FROM pages WHERE id IN (
			SELECT pages.id FROM pages JOIN sources ON sources.id = pages.source_id
			WHERE pages.source_id = ? AND pages.generation != sources.index_generation
			LIMIT ${PAGES_PER_DELETE})`
	);
	while (inTransaction(db, () => deleteSome.run(sourceId).changes) > 0);
}

/** Splits `items` into batches of at most `max` weight, each with at least one item. */
function batches<T>(items: T[], weight: (item: T) => number, max: number): T[][] {
	const result: T[][] = [];
	let batch: T[] = [];
	let total = 0;
	for (const item of items) {
		if (batch.length > 0 && total + weight(item) > max) {
			result.push(batch);
			batch = [];
			total = 0;
		}
		batch.push(item);
		total += weight(item);
	}
	if (batch.length > 0) result.push(batch);
	return result;
}

function inTransaction<T>(db: DatabaseSync, write: () => T): T {
	db.exec('BEGIN IMMEDIATE');
	try {
		const result = write();
		db.exec('COMMIT');
		return result;
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

// Enough to see a source's recent story; repeats are counted in one entry, not stored apart.
const SYNC_RUNS_KEPT = 100;

export interface SyncRun {
	outcome: 'unchanged' | 'synced' | 'failed';
	/** Null for a run that failed before it learned the commit. */
	commit: string | null;
	error: string | null;
}

/**
 * Stores a sync run of a source. A run that repeats the latest entry of the source, unchanged at
 * the same commit or failed with the same error, is counted in that entry instead. Does nothing
 * for a source deleted while it synced.
 */
export function recordSyncRun(
	db: DatabaseSync,
	sourceId: number,
	run: SyncRun & { startedAt: Date; finishedAt: Date }
) {
	const latest = db
		.prepare(
			`SELECT id, outcome, commit_hash, error FROM sync_runs
			WHERE source_id = ? ORDER BY id DESC LIMIT 1`
		)
		.get(sourceId) as
		{ id: number; outcome: string; commit_hash: string | null; error: string | null } | undefined;
	if (
		latest &&
		run.outcome !== 'synced' &&
		latest.outcome === run.outcome &&
		latest.commit_hash === run.commit &&
		latest.error === run.error
	) {
		db.prepare('UPDATE sync_runs SET finished_at = ?, runs = runs + 1 WHERE id = ?').run(
			run.finishedAt.toISOString(),
			latest.id
		);
		return;
	}
	db.prepare(
		`INSERT INTO sync_runs (source_id, started_at, finished_at, outcome, commit_hash, error)
		SELECT id, ?, ?, ?, ?, ? FROM sources WHERE id = ?`
	).run(
		run.startedAt.toISOString(),
		run.finishedAt.toISOString(),
		run.outcome,
		run.commit,
		run.error,
		sourceId
	);
	db.prepare(
		`DELETE FROM sync_runs WHERE source_id = :source AND id <= (
			SELECT id FROM sync_runs WHERE source_id = :source ORDER BY id DESC LIMIT 1 OFFSET :kept)`
	).run({ source: sourceId, kept: SYNC_RUNS_KEPT });
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
