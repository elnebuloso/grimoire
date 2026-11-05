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
});

describe('duplicate sources page', () => {
	it('says so when no two sources overlap', () => {
		db.exec(`INSERT INTO sources (id, slug, name, git_url, branch, path)
			VALUES (1, 'billing-docs', 'Billing', 'https://git.example.com/billing.git', 'main', 'docs'),
				(2, 'platform-docs', 'Platform', 'https://git.example.com/platform.git', 'main', 'docs')`);
		expect(load()).toEqual({ pairs: [] });
	});

	it('lists duplicates and overlaps of every visibility', () => {
		db.exec(`INSERT INTO sources (id, slug, name, git_url, branch, path, visibility)
			VALUES (1, 'platform-docs', 'Platform', 'https://git.example.com/platform.git', 'main', 'docs', 'internal'),
				(2, 'platform-next', 'Platform next', 'https://git.example.com/Platform', 'release-2', 'docs/', 'public'),
				(3, 'platform-api', 'Platform API', 'https://git.example.com/platform.git', 'main', 'docs/api', 'internal')`);
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
