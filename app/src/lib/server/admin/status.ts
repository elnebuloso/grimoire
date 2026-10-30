import type { DatabaseSync } from 'node:sqlite';
import { grimoireId } from '../grimoire-id';
import { readSnippets, renderSnippet } from '../search/query';
import { sourceStats, type SourceStats } from '../stats';

export interface PageSummary {
	/** Path relative to the source path, e.g. `deploy.md`. */
	file: string;
	title: string;
	snippets: number;
	tokens: number;
}

export interface DeadLink {
	file: string;
	/** Section of the page holding the link; null for the part before the first heading. */
	anchor: string | null;
	target: string;
}

export interface SyncHistoryEntry {
	/** When the first of the counted runs started. */
	startedAt: string;
	/** When the last of the counted runs finished. */
	finishedAt: string;
	outcome: 'unchanged' | 'synced' | 'failed';
	commit: string | null;
	error: string | null;
	/** How many runs in a row ended like this one. */
	runs: number;
}

export interface DeadLinkInSource extends DeadLink {
	sourceId: number;
	source: string;
}

/** The dead links of all sources, or of one, by source and page. */
export function deadLinks(db: DatabaseSync, sourceId?: number): DeadLinkInSource[] {
	return db
		.prepare(
			`SELECT sources.id AS sourceId, sources.slug AS source, pages.file, links.anchor,
				links.target
			FROM links
			JOIN live_pages AS pages ON pages.id = links.page_id
			JOIN sources ON sources.id = pages.source_id
			WHERE links.dead = 1 AND (:source IS NULL OR sources.id = :source)
			ORDER BY sources.slug, pages.file, links.anchor, links.target`
		)
		.all({ source: sourceId ?? null }) as unknown as DeadLinkInSource[];
}

export interface SourceStatus {
	lastCheckedAt: string | null;
	lastSyncedAt: string | null;
	lastCommit: string | null;
	error: string | null;
	warnings: string[];
	pages: PageSummary[];
	totals: { pages: number; snippets: number; tokens: number };
	deadLinks: DeadLink[];
	/** Newest first. */
	history: SyncHistoryEntry[];
}

/** The sync state of a source; undefined when there is no such source. */
export function sourceStatus(db: DatabaseSync, sourceId: number): SourceStatus | undefined {
	const source = db
		.prepare(
			`SELECT last_checked_at, last_synced_at, last_commit, error, warnings
			FROM sources WHERE id = ?`
		)
		.get(sourceId) as
		| {
				last_checked_at: string | null;
				last_synced_at: string | null;
				last_commit: string | null;
				error: string | null;
				warnings: string;
		  }
		| undefined;
	if (!source) return undefined;
	const pages = db
		.prepare(
			`SELECT pages.file, pages.title, count(snippets.id) AS snippets,
				coalesce(sum(snippets.tokens), 0) AS tokens
			FROM live_pages AS pages LEFT JOIN snippets ON snippets.page_id = pages.id
			WHERE pages.source_id = ?
			GROUP BY pages.id ORDER BY pages.file`
		)
		.all(sourceId) as unknown as PageSummary[];
	const history = db
		.prepare(
			`SELECT started_at AS startedAt, finished_at AS finishedAt, outcome, commit_hash AS 'commit',
				error, runs
			FROM sync_runs WHERE source_id = ? ORDER BY id DESC`
		)
		.all(sourceId) as unknown as SyncHistoryEntry[];

	return {
		lastCheckedAt: source.last_checked_at,
		lastSyncedAt: source.last_synced_at,
		lastCommit: source.last_commit,
		error: source.error,
		warnings: JSON.parse(source.warnings) as string[],
		pages,
		totals: {
			pages: pages.length,
			snippets: pages.reduce((sum, page) => sum + page.snippets, 0),
			tokens: pages.reduce((sum, page) => sum + page.tokens, 0)
		},
		deadLinks: deadLinks(db, sourceId).map(({ file, anchor, target }) => ({
			file,
			anchor,
			target
		})),
		history
	};
}

/** A snippet of a page as the agent operation `read` returns it. */
export interface PreviewSnippet {
	id: string;
	titlePath: string[];
	tokens: number;
	/** The snippet with its `Source:` and `Edit:` lines. */
	markdown: string;
}

/**
 * The snippets of a page in page order: empty for a page without any, undefined when the source
 * has no such page.
 */
export function previewPage(
	db: DatabaseSync,
	source: string,
	file: string
): PreviewSnippet[] | undefined {
	const page = db
		.prepare(
			`SELECT 1 FROM live_pages AS pages
			JOIN sources ON sources.id = pages.source_id
			WHERE sources.slug = ? AND pages.file = ?`
		)
		.get(source, file);
	if (!page) return undefined;
	return readSnippets(db, { source, file }, 'all').map((hit) => ({
		id: grimoireId(hit, hit.anchor),
		titlePath: hit.titlePath,
		tokens: hit.tokens,
		markdown: renderSnippet(hit)
	}));
}

export interface Totals {
	sources: number;
	pages: number;
	snippets: number;
	tokens: number;
	deadLinks: number;
	apiKeys: number;
}

/** The sync state of a source, as the dashboard shows it. */
export interface SourceHealth {
	sourceId: number;
	source: string;
	lastSyncedAt: string | null;
	neverSynced: boolean;
	error: string | null;
	warnings: string[];
}

/** Whether a source belongs in the dashboard's "needs attention" list. */
export function needsAttention(health: SourceHealth): boolean {
	return health.neverSynced || health.error !== null || health.warnings.length > 0;
}

/** The sync state of every source, by slug. */
export function sourceHealth(db: DatabaseSync): SourceHealth[] {
	const rows = db
		.prepare(
			`SELECT id AS sourceId, slug AS source, last_synced_at AS lastSyncedAt, error, warnings
			FROM sources
			ORDER BY slug`
		)
		.all() as unknown as (Omit<SourceHealth, 'neverSynced' | 'warnings'> & { warnings: string })[];
	return rows.map((row) => ({
		...row,
		neverSynced: row.lastSyncedAt === null,
		warnings: JSON.parse(row.warnings) as string[]
	}));
}

export interface Dashboard {
	totals: Totals;
	sources: SourceStats[];
	/** Sources with a sync error, sync warnings, or no sync yet. */
	attention: SourceHealth[];
}

export function dashboard(db: DatabaseSync): Dashboard {
	const sources = sourceStats(db);
	const sum = (figure: 'pages' | 'snippets' | 'tokens' | 'deadLinks') =>
		sources.reduce((total, source) => total + source[figure], 0);
	const { apiKeys } = db.prepare('SELECT count(*) AS apiKeys FROM api_keys').get() as {
		apiKeys: number;
	};
	return {
		totals: {
			sources: sources.length,
			pages: sum('pages'),
			snippets: sum('snippets'),
			tokens: sum('tokens'),
			deadLinks: sum('deadLinks'),
			apiKeys
		},
		sources,
		attention: sourceHealth(db).filter(needsAttention)
	};
}
