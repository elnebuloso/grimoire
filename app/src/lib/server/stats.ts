import type { DatabaseSync } from 'node:sqlite';

/** Figures about a project that are safe to show without login: counts and times only. */
export interface ProjectStats {
	id: number;
	slug: string;
	description: string;
	sources: number;
	pages: number;
	snippets: number;
	tokens: number;
	/** Oldest last sync over the sources; null when a source was never synced or there is none. */
	oldestSync: string | null;
	sourcesWithError: number;
	deadLinks: number;
}

export function projectStats(db: DatabaseSync): ProjectStats[] {
	return db
		.prepare(
			`SELECT projects.id, projects.slug, projects.description,
				(SELECT count(*) FROM sources WHERE project_id = projects.id) AS sources,
				(SELECT count(*) FROM pages JOIN sources ON sources.id = pages.source_id
					WHERE sources.project_id = projects.id) AS pages,
				(SELECT count(*) FROM snippets JOIN pages ON pages.id = snippets.page_id
					JOIN sources ON sources.id = pages.source_id
					WHERE sources.project_id = projects.id) AS snippets,
				(SELECT coalesce(sum(tokens), 0) FROM snippets JOIN pages ON pages.id = snippets.page_id
					JOIN sources ON sources.id = pages.source_id
					WHERE sources.project_id = projects.id) AS tokens,
				(SELECT CASE WHEN count(*) = count(last_synced_at) THEN min(last_synced_at) END
					FROM sources WHERE project_id = projects.id) AS oldestSync,
				(SELECT count(*) FROM sources
					WHERE project_id = projects.id AND error IS NOT NULL) AS sourcesWithError,
				(SELECT count(*) FROM links JOIN pages ON pages.id = links.page_id
					JOIN sources ON sources.id = pages.source_id
					WHERE sources.project_id = projects.id AND links.dead = 1) AS deadLinks
			FROM projects
			ORDER BY projects.slug`
		)
		.all() as unknown as ProjectStats[];
}
