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
		expect(page.load({ locals: { user: ADMIN } } as never)).toEqual({ queries: [] });

		recordMissedQuery(db, { question: 'vpn', sources: ['platform-docs'] }, new Date());
		expect(page.load({ locals: { user: ADMIN } } as never)).toMatchObject({
			queries: [{ question: 'vpn', sources: ['platform-docs'], count: 1 }]
		});
	});

	it('lists a user only the queries that named one of their own sources', () => {
		db.exec(`INSERT INTO users (id, email, password_hash) VALUES (9, 'writer@example.com', 'hash');
			INSERT INTO sources (slug, name, git_url, branch, path, owner_id)
			VALUES ('release-drafts', 'Drafts', 'https://git.example.com/r.git', 'main', '', 9);`);
		const now = new Date();
		recordMissedQuery(db, { question: 'vpn', sources: ['platform-docs'] }, now);
		recordMissedQuery(
			db,
			{ question: 'freeze', sources: ['platform-docs', 'release-drafts'] },
			now
		);
		recordMissedQuery(db, { question: 'sso', sources: null }, now);

		const writer = { id: 9, email: 'writer@example.com', roles: [] };
		const { queries } = page.load({ locals: { user: writer } } as never) as {
			queries: { question: string }[];
		};
		expect(queries.map((query) => query.question)).toEqual(['freeze']);
	});
});
