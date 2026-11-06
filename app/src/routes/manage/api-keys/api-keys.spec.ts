import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { DatabaseSync } from 'node:sqlite';
import { openDatabase } from '#lib/server/db/schema.js';
import { createApiKey, listApiKeys } from '#lib/server/api-keys.js';
import * as page from './+page.server';

let db: DatabaseSync;

vi.mock('#lib/server/db/index.js', () => ({ database: () => db }));

beforeEach(() => {
	db = openDatabase(':memory:');
	db.exec(`INSERT INTO users (id, email, password_hash) VALUES
		(1, 'admin@example.com', 'hash'), (2, 'writer@example.com', 'hash')`);
	createApiKey(db, 'laptop', 'all', null, 2);
	createApiKey(db, 'ci', 'all', null, 1);
});

describe('all API keys', () => {
	it('lists every key with its owner, never the key', () => {
		expect(
			page.load({ url: new URL('https://grimoire.example/manage/api-keys') } as never)
		).toMatchObject({
			keys: {
				rows: [
					{ name: 'ci', owner: 'admin@example.com', lastUsedAt: null },
					{ name: 'laptop', owner: 'writer@example.com', lastUsedAt: null }
				],
				total: 2
			}
		});
		// Found by the owner as well as by the name.
		expect(
			page.load({
				url: new URL('https://grimoire.example/manage/api-keys?search=writer')
			} as never)
		).toMatchObject({ keys: { rows: [{ name: 'laptop' }], total: 1 }, filtered: true });
	});

	it("revokes another user's key", async () => {
		const laptop = listApiKeys(db).find((key) => key.name === 'laptop')!;
		await page.actions.revoke({
			request: new Request('https://grimoire.example/manage/api-keys', {
				method: 'POST',
				body: new URLSearchParams({ id: String(laptop.id) })
			})
		} as never);
		expect(listApiKeys(db).map((key) => key.name)).toEqual(['ci']);
	});
});
