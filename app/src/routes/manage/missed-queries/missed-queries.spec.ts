import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { DatabaseSync } from 'node:sqlite';
import { openDatabase } from '#lib/server/db/schema.js';
import { recordMissedQuery } from '#lib/server/missed-queries.js';
import * as page from './+page.server';

let db: DatabaseSync;

const ADMIN = { id: 1, email: 'admin@example.com', roles: ['admin'] };

vi.mock('#lib/server/db/index.js', () => ({ database: () => db }));

beforeEach(() => {
	db = openDatabase(':memory:');
});

describe('queries without results page', () => {
	it('lists the recorded queries', () => {
		const load = (search = '') =>
			page.load({
				locals: { user: ADMIN },
				url: new URL(`https://grimoire.example/manage/missed-queries${search}`)
			} as never);
		expect(load()).toMatchObject({ queries: { rows: [], total: 0 }, filtered: false });

		recordMissedQuery(db, { question: 'vpn', sources: ['platform-docs'] }, new Date());
		expect(load()).toMatchObject({
			queries: { rows: [{ question: 'vpn', sources: ['platform-docs'], count: 1 }] }
		});
		expect(load('?search=kubernetes')).toMatchObject({ queries: { total: 0 }, filtered: true });
	});

	it('searches and sorts every recorded question, not only the latest ones', () => {
		const start = new Date('2026-10-30T12:00:00.000Z');
		const minutesLater = (minutes: number) => new Date(start.getTime() + minutes * 60_000);
		for (let ask = 0; ask < 3; ask++) {
			recordMissedQuery(db, { question: 'vpn on linux', sources: null }, start);
		}
		for (let question = 0; question < 250; question++) {
			recordMissedQuery(
				db,
				{ question: `question ${question}`, sources: null },
				minutesLater(question + 1)
			);
		}
		const load = (search: string) =>
			page.load({
				locals: { user: ADMIN },
				url: new URL(`https://grimoire.example/manage/missed-queries${search}`)
			} as never);

		expect(load('')).toMatchObject({ queries: { total: 251 } });
		expect(load('?search=vpn')).toMatchObject({
			queries: { rows: [{ question: 'vpn on linux', count: 3 }] }
		});
		const byCount = load('?sort=-count') as { queries: { rows: { question: string }[] } };
		expect(byCount.queries.rows[0].question).toBe('vpn on linux');
	});
});
