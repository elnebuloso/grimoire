import type { DatabaseSync } from 'node:sqlite';

// Questions can carry internal details, so they are kept only as long as they help.
const KEEP_DAYS = 30;
// An agent stuck in a loop must not fill the disk within those days.
const MAX_ENTRIES = 10_000;
const MAX_LISTED = 200;

export interface MissedQuery {
	question: string;
	/** The slugs asked for, comma-separated; null for a query across all sources. */
	sources: string | null;
	count: number;
	lastAskedAt: string;
}

/** Records an agent query that found nothing, and forgets entries past their time. */
export function recordMissedQuery(
	db: DatabaseSync,
	query: { question: string; sources: string[] | null },
	now: Date
) {
	const cutoff = new Date(now.getTime() - KEEP_DAYS * 86_400_000).toISOString();
	db.prepare('INSERT INTO missed_queries (question, sources, asked_at) VALUES (?, ?, ?)').run(
		query.question,
		query.sources ? [...query.sources].sort().join(', ') : null,
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
	return db
		.prepare(
			`SELECT question, sources, count(*) AS count, max(asked_at) AS lastAskedAt
			FROM missed_queries
			GROUP BY question, sources
			ORDER BY lastAskedAt DESC
			LIMIT ?`
		)
		.all(MAX_LISTED) as unknown as MissedQuery[];
}
