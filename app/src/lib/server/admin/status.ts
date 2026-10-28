import type { DatabaseSync } from 'node:sqlite';
import { readById } from '../agent/operations';

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
			FROM pages LEFT JOIN snippets ON snippets.page_id = pages.id
			WHERE pages.source_id = ?
			GROUP BY pages.id ORDER BY pages.file`
		)
		.all(sourceId) as unknown as PageSummary[];
	const deadLinks = db
		.prepare(
			`SELECT pages.file, links.anchor, links.target
			FROM links JOIN pages ON pages.id = links.page_id
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

/** The page as the agent operation `read` returns it; undefined when the source has no such page. */
export function previewPage(
	db: DatabaseSync,
	project: string,
	source: string,
	file: string
): string | undefined {
	if (!file.endsWith('.md')) return undefined;
	const result = readById(db, `${project}/${source}/${file.slice(0, -'.md'.length)}`, undefined);
	return result.found ? result.markdown : undefined;
}
