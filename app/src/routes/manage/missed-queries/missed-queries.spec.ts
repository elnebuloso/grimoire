import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { DatabaseSync } from 'node:sqlite';
import { openDatabase } from '#lib/server/db/schema.js';
import { recordMissedQuery } from '#lib/server/missed-queries.js';
import * as page from './+page.server';

let db: DatabaseSync;

vi.mock('#lib/server/db/index.js', () => ({ database: () => db }));

beforeEach(() => {
	db = openDatabase(':memory:');
});

describe('queries without results page', () => {
	it('lists the recorded queries', () => {
		expect(page.load({} as never)).toEqual({ queries: [] });

		recordMissedQuery(db, { question: 'vpn', project: 'platform' }, new Date());
		expect(page.load({} as never)).toMatchObject({
			queries: [{ question: 'vpn', project: 'platform', count: 1 }]
		});
	});
});
