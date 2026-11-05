import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { DatabaseSync } from 'node:sqlite';
import { openDatabase } from '#lib/server/db/schema.js';
import * as page from './+page.server';

let db: DatabaseSync;

vi.mock('#lib/server/db/index.js', () => ({ database: () => db }));

function load() {
	return page.load({} as never) as { pairs: unknown[] };
}

beforeEach(() => {
	db = openDatabase(':memory:');
	db.exec(
		`INSERT INTO users (id, email, password_hash) VALUES (1, 'admin@example.com', 'hash'), (2, 'writer@example.com', 'hash')`
	);
});

describe('duplicate sources page', () => {
	it('says so when no two sources overlap', () => {
		db.exec(`INSERT INTO sources (id, slug, name, git_url, branch, path)
			VALUES (1, 'billing-docs', 'Billing', 'https://git.example.com/billing.git', 'main', 'docs'),
				(2, 'platform-docs', 'Platform', 'https://git.example.com/platform.git', 'main', 'docs')`);
		expect(load()).toEqual({ pairs: [] });
	});

	it('lists duplicates and overlaps of every owner, private ones included', () => {
		db.exec(`INSERT INTO sources (id, slug, name, git_url, branch, path, visibility, owner_id)
			VALUES (1, 'platform-docs', 'Platform', 'https://git.example.com/platform.git', 'main', 'docs', 'internal', 1),
				(2, 'platform-next', 'Platform next', 'https://git.example.com/Platform', 'release-2', 'docs/', 'private', 2),
				(3, 'platform-api', 'Platform API', 'https://git.example.com/platform.git', 'main', 'docs/api', 'private', 2)`);
		expect(load()).toEqual({
			pairs: [
				{
					kind: 'overlap',
					first: { id: 3, slug: 'platform-api' },
					second: { id: 1, slug: 'platform-docs' }
				},
				{
					kind: 'overlap',
					first: { id: 3, slug: 'platform-api' },
					second: { id: 2, slug: 'platform-next' }
				},
				{
					kind: 'duplicate',
					first: { id: 1, slug: 'platform-docs' },
					second: { id: 2, slug: 'platform-next' }
				}
			]
		});
	});
});
