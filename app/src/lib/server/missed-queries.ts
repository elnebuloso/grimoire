import type { DatabaseSync } from 'node:sqlite';

// Questions can carry internal details, so they are kept only as long as they help.
const KEEP_DAYS = 30;
// An agent stuck in a loop must not fill the disk within those days.
const MAX_ENTRIES = 10_000;

export interface MissedQuery {
	question: string;
	/** The slugs asked for, sorted; null for a query across all sources. */
	sources: string[] | null;
	count: number;
	lastAskedAt: string;
	/** The searched words no source contained when it was last asked; null when it found nothing. */
	unknownWords: string[] | null;
}

/**
 * Records an agent query that found nothing, or found hits while some of its words occur in no
 * source, and forgets entries past their time.
 */
export function recordMissedQuery(
	db: DatabaseSync,
	query: { question: string; sources: string[] | null; unknownWords?: string[] | null },
	now: Date
) {
	const cutoff = new Date(now.getTime() - KEEP_DAYS * 86_400_000).toISOString();
	db.prepare(
		'INSERT INTO missed_queries (question, sources, unknown_words, asked_at) VALUES (?, ?, ?, ?)'
	).run(
		query.question,
		query.sources ? JSON.stringify([...query.sources].sort()) : null,
		query.unknownWords ? JSON.stringify(query.unknownWords) : null,
		now.toISOString()
	);
	db.prepare('DELETE FROM missed_queries WHERE asked_at < ?').run(cutoff);
	db.prepare(
		`DELETE FROM missed_queries WHERE id <= (
			SELECT id FROM missed_queries ORDER BY id DESC LIMIT 1 OFFSET ?)`
	).run(MAX_ENTRIES);
}

/** The recorded questions, each once per set of sources with how often it was asked, latest first. */
export function listMissedQueries(db: DatabaseSync): MissedQuery[] {
	// With max() SQLite takes the bare column from the row holding the maximum: the latest ask.
	const rows = db
		.prepare(
			`SELECT question, sources, count(*) AS count, max(asked_at) AS lastAskedAt,
				unknown_words AS unknownWords
			FROM missed_queries
			GROUP BY question, sources
			ORDER BY lastAskedAt DESC`
		)
		.all() as unknown as (Omit<MissedQuery, 'sources' | 'unknownWords'> & {
		sources: string | null;
		unknownWords: string | null;
	})[];
	return rows.map((row) => ({
		...row,
		sources: row.sources === null ? null : JSON.parse(row.sources),
		unknownWords: row.unknownWords === null ? null : JSON.parse(row.unknownWords)
	}));
}
