import { describe, it, expect, beforeEach } from 'vitest';
import type { DatabaseSync } from 'node:sqlite';
import { openDatabase } from './db/schema';
import { listMissedQueries, recordMissedQuery } from './missed-queries';

let db: DatabaseSync;

const NOW = new Date('2026-10-30T12:00:00.000Z');

function daysLater(days: number) {
	return new Date(NOW.getTime() + days * 86_400_000);
}

function count() {
	return (db.prepare('SELECT count(*) AS n FROM missed_queries').get() as { n: number }).n;
}

beforeEach(() => {
	db = openDatabase(':memory:');
});

describe('missed queries', () => {
	it('lists each question once per set of sources with how often and when it was last asked', () => {
		recordMissedQuery(db, { question: 'release process', sources: null }, NOW);
		recordMissedQuery(db, { question: 'release process', sources: null }, daysLater(1));
		recordMissedQuery(db, { question: 'release process', sources: ['platform-docs'] }, NOW);
		recordMissedQuery(db, { question: 'vpn', sources: ['platform-docs'] }, daysLater(2));

		expect(listMissedQueries(db)).toEqual([
			{
				question: 'vpn',
				sources: 'platform-docs',
				count: 1,
				lastAskedAt: '2026-11-01T12:00:00.000Z'
			},
			{
				question: 'release process',
				sources: null,
				count: 2,
				lastAskedAt: '2026-10-31T12:00:00.000Z'
			},
			{
				question: 'release process',
				sources: 'platform-docs',
				count: 1,
				lastAskedAt: '2026-10-30T12:00:00.000Z'
			}
		]);
	});

	it('records several sources sorted, so the same set in another order counts as one', () => {
		recordMissedQuery(db, { question: 'vpn', sources: ['platform-docs', 'billing-docs'] }, NOW);
		recordMissedQuery(db, { question: 'vpn', sources: ['billing-docs', 'platform-docs'] }, NOW);

		expect(listMissedQueries(db)).toMatchObject([
			{ question: 'vpn', sources: 'billing-docs, platform-docs', count: 2 }
		]);
	});

	it('forgets questions older than 30 days', () => {
		recordMissedQuery(db, { question: 'old', sources: null }, NOW);
		recordMissedQuery(db, { question: 'recent', sources: null }, daysLater(30));
		expect(count()).toBe(2);

		recordMissedQuery(db, { question: 'new', sources: null }, daysLater(30.001));
		expect(listMissedQueries(db).map((query) => query.question)).toEqual(['new', 'recent']);
	});

	it('keeps at most 10,000 entries, dropping the oldest', () => {
		db.exec(`WITH RECURSIVE n(i) AS (SELECT 1 UNION ALL SELECT i + 1 FROM n WHERE i < 10000)
			INSERT INTO missed_queries (question, sources, asked_at)
			SELECT 'q' || i, NULL, '${NOW.toISOString()}' FROM n`);

		recordMissedQuery(db, { question: 'one more', sources: null }, NOW);

		expect(count()).toBe(10_000);
		expect(
			db.prepare("SELECT count(*) AS n FROM missed_queries WHERE question = 'q1'").get()
		).toEqual({
			n: 0
		});
	});
});
