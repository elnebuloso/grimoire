import type { DatabaseSync } from 'node:sqlite';

/** Figures about a source that are safe to show without login: counts and times only. */
export interface SourceStats {
	id: number;
	slug: string;
	name: string;
	description: string;
	pages: number;
	snippets: number;
	tokens: number;
	/** Null while the source was never synced. */
	lastSync: string | null;
	error: boolean;
	deadLinks: number;
}

export function sourceStats(db: DatabaseSync): SourceStats[] {
	const rows = db
		.prepare(
			`SELECT sources.id, sources.slug, sources.name, sources.description,
				(SELECT count(*) FROM live_pages AS pages WHERE pages.source_id = sources.id) AS pages,
				(SELECT count(*) FROM snippets JOIN live_pages AS pages ON pages.id = snippets.page_id
					WHERE pages.source_id = sources.id) AS snippets,
				(SELECT coalesce(sum(tokens), 0) FROM snippets
					JOIN live_pages AS pages ON pages.id = snippets.page_id
					WHERE pages.source_id = sources.id) AS tokens,
				sources.last_synced_at AS lastSync,
				sources.error IS NOT NULL AS error,
				(SELECT count(*) FROM links JOIN live_pages AS pages ON pages.id = links.page_id
					WHERE pages.source_id = sources.id AND links.dead = 1) AS deadLinks
			FROM sources
			ORDER BY sources.slug`
		)
		.all() as unknown as (Omit<SourceStats, 'error'> & { error: number })[];
	return rows.map((row) => ({ ...row, error: row.error === 1 }));
}
