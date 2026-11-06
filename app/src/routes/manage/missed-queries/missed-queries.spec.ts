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
});
