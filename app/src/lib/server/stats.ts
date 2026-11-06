import type { DatabaseSync } from 'node:sqlite';
import type { Visibility } from '#lib/source-fields.js';

/** Figures about a source that are safe to show without login: counts and times only. */
export interface SourceStats {
	id: number;
	slug: string;
	name: string;
	description: string;
	visibility: Visibility;
	/** Where the documentation is published; null when not set. */
	docsUrl: string | null;
	pages: number;
	snippets: number;
	tokens: number;
	/** Null while the source was never synced. */
	lastSync: string | null;
	/** The latest sync run, whatever came of it, unchanged included; null while never run. */
	lastCheck: string | null;
	error: boolean;
	/** Polling skips the source; only "Sync now" syncs it. */
	paused: boolean;
	deadLinks: number;
	/** Problems the last sync reported without failing, such as an include it could not resolve. */
	warnings: number;
}

type IndexCounts = Pick<SourceStats, 'pages' | 'snippets' | 'tokens' | 'deadLinks'>;

// Counting snippets and tokens reads every snippet of a source: on a large instance a fifth of a
// second per call, and the public start page calls it on every visit. The counts change only with
// a new index, which raises the source's generation; until then they are taken from here.
const countsByDatabase = new WeakMap<
	DatabaseSync,
	Map<number, IndexCounts & { generation: number }>
>();

export function sourceStats(db: DatabaseSync): SourceStats[] {
	const rows = db
		.prepare(
			`SELECT sources.id, sources.slug, sources.name, sources.description, sources.visibility,
				sources.docs_url AS docsUrl,
				sources.index_generation AS generation,
				sources.last_synced_at AS lastSync,
				sources.last_checked_at AS lastCheck,
				sources.error IS NOT NULL AS error,
				sources.paused,
				json_array_length(sources.warnings) AS warnings
			FROM sources
			ORDER BY sources.slug`
		)
		.all() as unknown as (Omit<SourceStats, 'error' | 'paused' | keyof IndexCounts> & {
		generation: number;
		error: number;
		paused: number;
	})[];
	const cached = countsByDatabase.get(db);
	const current = new Map<number, IndexCounts & { generation: number }>();
	const stats = rows.map(({ generation, ...row }) => {
		const known = cached?.get(row.id);
		const counts =
			known?.generation === generation ? known : { generation, ...indexCounts(db, row.id) };
		current.set(row.id, counts);
		return {
			...row,
			pages: counts.pages,
			snippets: counts.snippets,
			tokens: counts.tokens,
			deadLinks: counts.deadLinks,
			error: row.error === 1,
			paused: row.paused === 1
		};
	});
	// Kept for the sources that still exist only.
	countsByDatabase.set(db, current);
	return stats;
}

function indexCounts(db: DatabaseSync, sourceId: number): IndexCounts {
	return db
		.prepare(
			`SELECT
				(SELECT count(*) FROM live_pages AS pages WHERE pages.source_id = :id) AS pages,
				(SELECT count(*) FROM snippets JOIN live_pages AS pages ON pages.id = snippets.page_id
					WHERE pages.source_id = :id) AS snippets,
				(SELECT coalesce(sum(tokens), 0) FROM snippets
					JOIN live_pages AS pages ON pages.id = snippets.page_id
					WHERE pages.source_id = :id) AS tokens,
				(SELECT count(*) FROM links JOIN live_pages AS pages ON pages.id = links.page_id
					WHERE pages.source_id = :id AND links.dead = 1) AS deadLinks`
		)
		.get({ id: sourceId }) as unknown as IndexCounts;
}
