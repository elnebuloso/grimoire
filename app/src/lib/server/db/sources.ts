import type { DatabaseSync } from 'node:sqlite';
import { setImmediate as nextTurn } from 'node:timers/promises';
import type { ChunkedPage } from '../parsing/chunk';
import type { Link } from '../parsing/links';
import type { PreprocessedPage } from '../parsing/preprocess';
import { inTransaction } from './transaction.ts';
import type { SyncErrorKind } from '../sync/failure';

export interface SyncSource {
	id: number;
	gitUrl: string;
	branch: string;
	path: string;
	exclusions: string[];
	username: string | null;
	encryptedToken: string | null;
	lastCommit: string | null;
	/** The commit whose indexing failed with `error`; null once a sync succeeds or is unchanged. */
	failedCommit: string | null;
	error: string | null;
	/** Recorded with the error; null for one stored before kinds were recorded. */
	errorKind: SyncErrorKind | null;
}

/** What the index of a source is built from. */
export type IndexSettings = Pick<SyncSource, 'gitUrl' | 'branch' | 'path' | 'exclusions'>;

export interface IndexedPage {
	/** Path relative to the source path, e.g. `deploy.md`. */
	file: string;
	/** Index of the page in the site's `nav`; undefined when it is not listed there. */
	navPosition?: number;
	metadata: PreprocessedPage;
	chunked: ChunkedPage;
	/** Prose and code of each snippet apart, for the search index. */
	searchTexts: { text: string; code: string }[];
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
	failed_commit: string | null;
	error: string | null;
	error_kind: SyncErrorKind | null;
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
			`SELECT id, git_url, branch, path, exclusions, username, encrypted_token, last_commit,
				failed_commit, error, error_kind
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
		lastCommit: row.last_commit,
		failedCommit: row.failed_commit,
		error: row.error,
		errorKind: row.error_kind
	};
}

/**
 * Whether what the index depends on changed since `started` was read: a save during a sync drops
 * the commits so the next sync indexes with the new settings, and the result of the running one,
 * built with the old settings, must not bring them back. False for a source deleted meanwhile.
 */
export function indexSettingsChanged(db: DatabaseSync, started: SyncSource): boolean {
	const now = db
		.prepare('SELECT git_url, branch, path, exclusions FROM sources WHERE id = ?')
		.get(started.id) as Pick<SourceRow, 'git_url' | 'branch' | 'path' | 'exclusions'> | undefined;
	if (!now) return false;
	return (
		now.git_url !== started.gitUrl ||
		now.branch !== started.branch ||
		now.path !== started.path ||
		JSON.stringify(JSON.parse(now.exclusions)) !== JSON.stringify(started.exclusions)
	);
}

/** Drops the commit the index was built from, so the next sync indexes again. */
export function forgetIndexedCommit(db: DatabaseSync, sourceId: number) {
	db.prepare('UPDATE sources SET last_commit = NULL WHERE id = ?').run(sourceId);
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
 *
 * With `startedFrom`, the new index goes live only while the source still has those settings: a
 * sync that waited while the source was edited would otherwise publish what the old settings
 * reached. False when it did not go live; its pages are deleted again.
 */
export function replaceSourceIndex(
	db: DatabaseSync,
	sourceId: number,
	index: SourceIndex,
	{
		snippetsPerBatch = SNIPPETS_PER_BATCH,
		startedFrom
	}: { snippetsPerBatch?: number; startedFrom?: IndexSettings } = {}
): boolean {
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
	// What an interrupted sync left behind would collide with the pages written now.
	deleteStalePages(db, sourceId, snippetsPerBatch);
	const { generation } = db
		.prepare('SELECT index_generation + 1 AS generation FROM sources WHERE id = ?')
		.get(sourceId) as { generation: number };
	const pageIds = new Map<string, number>();

	const snippetCount = (page: IndexedPage) => page.chunked.snippets.length;
	for (const batch of batches(index.pages, snippetCount, snippetsPerBatch)) {
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

	const settingsMatch = startedFrom
		? 'AND git_url = ? AND branch = ? AND path = ? AND json(exclusions) = json(?)'
		: '';
	const settings = startedFrom
		? [
				startedFrom.gitUrl,
				startedFrom.branch,
				startedFrom.path,
				JSON.stringify(startedFrom.exclusions)
			]
		: [];
	const { changes } = db
		.prepare(
			`UPDATE sources SET index_generation = ?, last_commit = ?, last_synced_at = ?, error = NULL,
				error_kind = NULL, failed_commit = NULL, warnings = ?
			WHERE id = ? ${settingsMatch}`
		)
		.run(
			generation,
			index.commit,
			new Date().toISOString(),
			JSON.stringify(index.warnings),
			sourceId,
			...settings
		);
	deleteStalePages(db, sourceId, snippetsPerBatch);
	return changes > 0;
}

/** Deletes the pages of a source that are not live, with their snippets and links. */
function deleteStalePages(db: DatabaseSync, sourceId: number, snippetsPerBatch: number) {
	while (deletePageBatch(db, sourceId, 'stale', snippetsPerBatch));
}

/**
 * Deletes what is left of earlier generations of a source's index, in short transactions with
 * other requests answered between them. Only a run of the same source writes a generation that is
 * not live yet, and the sync queue never runs two of those at once.
 */
export async function deleteStaleIndex(
	db: DatabaseSync,
	sourceId: number,
	{ snippetsPerBatch = SNIPPETS_PER_BATCH } = {}
) {
	while (deletePageBatch(db, sourceId, 'stale', snippetsPerBatch)) await nextTurn();
}

/**
 * Deletes a source with its index and history. The index goes in short transactions, and other
 * requests are answered between them: a large source has tens of thousands of snippets.
 */
export async function deleteSource(
	db: DatabaseSync,
	sourceId: number,
	{ snippetsPerBatch = SNIPPETS_PER_BATCH } = {}
) {
	while (deletePageBatch(db, sourceId, 'all', snippetsPerBatch)) await nextTurn();
	db.prepare('DELETE FROM sources WHERE id = ?').run(sourceId);
}

/**
 * Deletes one batch of the pages of a source, all or those that are not live: first their
 * snippets, then, once none are left, the pages with their links. False when nothing was left.
 */
function deletePageBatch(
	db: DatabaseSync,
	sourceId: number,
	which: 'stale' | 'all',
	snippetsPerBatch: number
): boolean {
	const pages = `SELECT pages.id FROM pages JOIN sources ON sources.id = pages.source_id
		WHERE pages.source_id = ?
			${which === 'stale' ? 'AND pages.generation != sources.index_generation' : ''}`;
	// Snippets first and batched like the inserts: each takes its search entry along, and a single
	// page can have a thousand of them.
	const deleteSnippets = db.prepare(
		`DELETE FROM snippets WHERE id IN (
			SELECT id FROM snippets WHERE page_id IN (${pages}) LIMIT ?)`
	);
	const deletePages = db.prepare(
		`DELETE FROM pages WHERE id IN (${pages} LIMIT ${PAGES_PER_DELETE})`
	);
	return inTransaction(
		db,
		() =>
			deleteSnippets.run(sourceId, snippetsPerBatch).changes > 0 ||
			deletePages.run(sourceId).changes > 0
	);
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

/**
 * Stores why a sync failed; the index of the last successful sync stays as it is. A commit given
 * as `failedCommit` is not indexed again unless forced.
 */
export function recordSyncError(
	db: DatabaseSync,
	sourceId: number,
	error: { message: string; kind: SyncErrorKind },
	/** The commit to remember as failed; null forgets the remembered one, undefined keeps it. */
	failedCommit?: string | null
) {
	if (failedCommit === undefined) {
		db.prepare('UPDATE sources SET error = ?, error_kind = ? WHERE id = ?').run(
			error.message,
			error.kind,
			sourceId
		);
	} else {
		db.prepare('UPDATE sources SET error = ?, error_kind = ?, failed_commit = ? WHERE id = ?').run(
			error.message,
			error.kind,
			failedCommit,
			sourceId
		);
	}
}

/** The source was reachable and is up to date, so an earlier error no longer applies. */
export function clearSyncError(db: DatabaseSync, sourceId: number) {
	db.prepare(
		'UPDATE sources SET error = NULL, error_kind = NULL, failed_commit = NULL WHERE id = ?'
	).run(sourceId);
}

// Enough to see a source's recent story; repeats are counted in one entry, not stored apart.
const SYNC_RUNS_KEPT = 100;

export interface SyncRun {
	outcome: 'unchanged' | 'synced' | 'failed';
	/** Null for a run that failed before it learned the commit. */
	commit: string | null;
	error: string | null;
	errorKind: SyncErrorKind | null;
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
		`INSERT INTO sync_runs (source_id, started_at, finished_at, outcome, commit_hash, error, error_kind)
		SELECT id, ?, ?, ?, ?, ?, ? FROM sources WHERE id = ?`
	).run(
		run.startedAt.toISOString(),
		run.finishedAt.toISOString(),
		run.outcome,
		run.commit,
		run.error,
		run.errorKind,
		sourceId
	);
	db.prepare(
		`DELETE FROM sync_runs WHERE source_id = :source AND id <= (
			SELECT id FROM sync_runs WHERE source_id = :source ORDER BY id DESC LIMIT 1 OFFSET :kept)`
	).run({ source: sourceId, kept: SYNC_RUNS_KEPT });
}
