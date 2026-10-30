import type { DatabaseSync } from 'node:sqlite';
import { readSnippets } from '../agent/operations';
import { grimoireId } from '../grimoire-id';
import { renderSnippet } from '../search/query';
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

export interface SourceStatus {
	lastCheckedAt: string | null;
	lastSyncedAt: string | null;
	lastCommit: string | null;
	error: string | null;
	warnings: string[];
	pages: PageSummary[];
	totals: { pages: number; snippets: number; tokens: number };
	deadLinks: DeadLink[];
}

export function sourceStatus(db: DatabaseSync, sourceId: number): SourceStatus {
	const source = db
		.prepare(
			`SELECT last_checked_at, last_synced_at, last_commit, error, warnings
			FROM sources WHERE id = ?`
		)
		.get(sourceId) as {
		last_checked_at: string | null;
		last_synced_at: string | null;
		last_commit: string | null;
		error: string | null;
		warnings: string;
	};
	const pages = db
		.prepare(
			`SELECT pages.file, pages.title, count(snippets.id) AS snippets,
				coalesce(sum(snippets.tokens), 0) AS tokens
			FROM live_pages AS pages LEFT JOIN snippets ON snippets.page_id = pages.id
			WHERE pages.source_id = ?
			GROUP BY pages.id ORDER BY pages.file`
		)
		.all(sourceId) as unknown as PageSummary[];
	const deadLinks = db
		.prepare(
			`SELECT pages.file, links.anchor, links.target
			FROM links JOIN live_pages AS pages ON pages.id = links.page_id
			WHERE pages.source_id = ? AND links.dead = 1
			ORDER BY pages.file, links.anchor, links.target`
		)
		.all(sourceId) as unknown as DeadLink[];

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
		deadLinks
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

export interface SourceNeedingAttention {
	projectId: number;
	project: string;
	sourceId: number;
	source: string;
	neverSynced: boolean;
	error: string | null;
	warnings: string[];
}

export interface Dashboard {
	totals: Totals;
	projects: ProjectStats[];
	/** Sources with a sync error, sync warnings, or no sync yet. */
	attention: SourceNeedingAttention[];
}

export function dashboard(db: DatabaseSync): Dashboard {
	const projects = projectStats(db);
	const sum = (figure: 'sources' | 'pages' | 'snippets' | 'tokens' | 'deadLinks') =>
		projects.reduce((total, project) => total + project[figure], 0);
	const { apiKeys } = db.prepare('SELECT count(*) AS apiKeys FROM api_keys').get() as {
		apiKeys: number;
	};
	const rows = db
		.prepare(
			`SELECT projects.id AS projectId, projects.slug AS project, sources.id AS sourceId,
				sources.slug AS source, sources.last_synced_at IS NULL AS neverSynced, sources.error,
				sources.warnings
			FROM sources JOIN projects ON projects.id = sources.project_id
			WHERE sources.error IS NOT NULL OR sources.warnings != '[]'
				OR sources.last_synced_at IS NULL
			ORDER BY projects.slug, sources.slug`
		)
		.all() as unknown as (Omit<SourceNeedingAttention, 'neverSynced' | 'warnings'> & {
		neverSynced: number;
		warnings: string;
	})[];

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
		attention: rows.map((row) => ({
			...row,
			neverSynced: row.neverSynced === 1,
			warnings: JSON.parse(row.warnings) as string[]
		}))
	};
}
