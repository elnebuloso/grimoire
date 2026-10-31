import type { DatabaseSync } from 'node:sqlite';

/** Figures about a source that are safe to show without login: counts and times only. */
export interface SourceStats {
	id: number;
	slug: string;
	name: string;
	description: string;
	/** Readable without an API key. */
	public: boolean;
	/** Where the documentation is published, for public sources only; null otherwise. */
	docsUrl: string | null;
	pages: number;
	snippets: number;
	tokens: number;
	/** Null while the source was never synced. */
	lastSync: string | null;
	error: boolean;
	/** Polling skips the source; only "Sync now" syncs it. */
	paused: boolean;
	deadLinks: number;
}

export function sourceStats(db: DatabaseSync): SourceStats[] {
	const rows = db
		.prepare(
			`SELECT sources.id, sources.slug, sources.name, sources.description, sources.public,
				CASE WHEN sources.public = 1 THEN sources.docs_url END AS docsUrl,
				(SELECT count(*) FROM live_pages AS pages WHERE pages.source_id = sources.id) AS pages,
				(SELECT count(*) FROM snippets JOIN live_pages AS pages ON pages.id = snippets.page_id
					WHERE pages.source_id = sources.id) AS snippets,
				(SELECT coalesce(sum(tokens), 0) FROM snippets
					JOIN live_pages AS pages ON pages.id = snippets.page_id
					WHERE pages.source_id = sources.id) AS tokens,
				sources.last_synced_at AS lastSync,
				sources.error IS NOT NULL AS error,
				sources.paused,
				(SELECT count(*) FROM links JOIN live_pages AS pages ON pages.id = links.page_id
					WHERE pages.source_id = sources.id AND links.dead = 1) AS deadLinks
			FROM sources
			ORDER BY sources.slug`
		)
		.all() as unknown as (Omit<SourceStats, 'error' | 'public' | 'paused'> & {
		error: number;
		public: number;
		paused: number;
	})[];
	return rows.map((row) => ({
		...row,
		public: row.public === 1,
		error: row.error === 1,
		paused: row.paused === 1
	}));
}
