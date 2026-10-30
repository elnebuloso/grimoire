import type { DatabaseSync } from 'node:sqlite';
import { grimoireId } from '../grimoire-id';
import { readSnippets, renderSnippet } from '../search/query';
import { projectStats, type ProjectStats } from '../stats';

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
	projectId: number;
	project: string;
	sourceId: number;
	source: string;
}

/** The dead links of all sources, or of one, by project, source and page. */
export function deadLinks(db: DatabaseSync, sourceId?: number): DeadLinkInSource[] {
	return db
		.prepare(
			`SELECT projects.id AS projectId, projects.slug AS project, sources.id AS sourceId,
				sources.slug AS source, pages.file, links.anchor, links.target
			FROM links
			JOIN live_pages AS pages ON pages.id = links.page_id
			JOIN sources ON sources.id = pages.source_id
			JOIN projects ON projects.id = sources.project_id
			WHERE links.dead = 1 AND (:source IS NULL OR sources.id = :source)
			ORDER BY projects.slug, sources.slug, pages.file, links.anchor, links.target`
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

/** The sync state of a source of the project; undefined when the project has no such source. */
export function sourceStatus(
	db: DatabaseSync,
	projectId: number,
	sourceId: number
): SourceStatus | undefined {
	const source = db
		.prepare(
			`SELECT last_checked_at, last_synced_at, last_commit, error, warnings
			FROM sources WHERE project_id = ? AND id = ?`
		)
		.get(projectId, sourceId) as
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
	project: string,
	source: string,
	file: string
): PreviewSnippet[] | undefined {
	const page = db
		.prepare(
			`SELECT 1 FROM live_pages AS pages
			JOIN sources ON sources.id = pages.source_id
			JOIN projects ON projects.id = sources.project_id
			WHERE projects.slug = ? AND sources.slug = ? AND pages.file = ?`
		)
		.get(project, source, file);
	if (!page) return undefined;
	return readSnippets(db, { project, source, file }, 'all').map((hit) => ({
		id: grimoireId(hit, hit.anchor),
		titlePath: hit.titlePath,
		tokens: hit.tokens,
		markdown: renderSnippet(hit)
	}));
}

export interface Totals {
	projects: number;
	sources: number;
	pages: number;
	snippets: number;
	tokens: number;
	deadLinks: number;
	apiKeys: number;
}

/** The sync state of a source, as the dashboard and the project page show it. */
export interface SourceHealth {
	projectId: number;
	project: string;
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

/** The sync state of every source, or of the sources of one project, by project and source slug. */
export function sourceHealth(db: DatabaseSync, projectId?: number): SourceHealth[] {
	const rows = db
		.prepare(
			`SELECT projects.id AS projectId, projects.slug AS project, sources.id AS sourceId,
				sources.slug AS source, sources.last_synced_at AS lastSyncedAt, sources.error,
				sources.warnings
			FROM sources JOIN projects ON projects.id = sources.project_id
			WHERE :project IS NULL OR projects.id = :project
			ORDER BY projects.slug, sources.slug`
		)
		.all({ project: projectId ?? null }) as unknown as (Omit<
		SourceHealth,
		'neverSynced' | 'warnings'
	> & { warnings: string })[];
	return rows.map((row) => ({
		...row,
		neverSynced: row.lastSyncedAt === null,
		warnings: JSON.parse(row.warnings) as string[]
	}));
}

export interface Dashboard {
	totals: Totals;
	projects: ProjectStats[];
	/** Sources with a sync error, sync warnings, or no sync yet. */
	attention: SourceHealth[];
}

export function dashboard(db: DatabaseSync): Dashboard {
	const projects = projectStats(db);
	const sum = (figure: 'sources' | 'pages' | 'snippets' | 'tokens' | 'deadLinks') =>
		projects.reduce((total, project) => total + project[figure], 0);
	const { apiKeys } = db.prepare('SELECT count(*) AS apiKeys FROM api_keys').get() as {
		apiKeys: number;
	};
	return {
		totals: {
			projects: projects.length,
			sources: sum('sources'),
			pages: sum('pages'),
			snippets: sum('snippets'),
			tokens: sum('tokens'),
			deadLinks: sum('deadLinks'),
			apiKeys
		},
		projects,
		attention: sourceHealth(db).filter(needsAttention)
	};
}
