import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { DatabaseSync } from 'node:sqlite';
import { openDatabase } from '#lib/server/db/schema.js';
import { listApiKeys, scopeForKey } from '#lib/server/api-keys.js';
import * as page from './+page.server';

let db: DatabaseSync;

vi.mock('#lib/server/db/index.js', () => ({ database: () => db }));

function formRequest(fields: [string, string][]) {
	return new Request('https://grimoire.example/manage/api-keys', {
		method: 'POST',
		body: new URLSearchParams(fields)
	});
}

async function create(fields: [string, string][]) {
	return page.actions.create({ request: formRequest(fields) } as never);
}

beforeEach(() => {
	db = openDatabase(':memory:');
	db.exec(`INSERT INTO projects (slug) VALUES ('billing'), ('platform')`);
});

describe('create', () => {
	it('returns the key once, scoped to the selected projects, and lists it without the key', async () => {
		const result = (await create([
			['name', ' ci '],
			['scope', 'selected'],
			['projects', 'platform']
		])) as { created: { name: string; key: string } };

		expect(result.created.name).toBe('ci');
		expect(scopeForKey(db, result.created.key)).toEqual({ scope: ['platform'] });
		const data = page.load({} as never);
		expect(data).toMatchObject({
			keys: [{ name: 'ci', projects: ['platform'] }],
			projects: ['billing', 'platform']
		});
		expect(JSON.stringify(data)).not.toContain(result.created.key);
	});

	it('creates a key for all projects', async () => {
		const result = (await create([
			['name', 'agent'],
			['scope', 'all'],
			['projects', 'platform']
		])) as { created: { key: string } };

		expect(scopeForKey(db, result.created.key)).toEqual({ scope: undefined });
	});

	it.each([
		[
			[
				['name', ' '],
				['scope', 'all']
			],
			'Enter a name.'
		],
		[
			[
				['name', 'ci'],
				['scope', 'selected']
			],
			'Choose all projects or at least one.'
		],
		[
			[
				['name', 'ci'],
				['scope', 'selected'],
				['projects', 'gone']
			],
			'A selected project no longer exists.'
		]
	] as [[string, string][], string][])(
		'rejects %j with "%s" and stores nothing',
		async (fields, error) => {
			expect(await create(fields)).toMatchObject({ status: 400, data: { error } });
			expect(db.prepare('SELECT count(*) AS n FROM api_keys').get()).toEqual({ n: 0 });
		}
	);
});

describe('revoke', () => {
	it('deletes the key, so it is rejected from then on', async () => {
		const { created } = (await create([
			['name', 'ci'],
			['scope', 'all']
		])) as { created: { key: string } };
		const [{ id }] = listApiKeys(db);

		await page.actions.revoke({ request: formRequest([['id', String(id)]]) } as never);

		expect(scopeForKey(db, created.key)).toBeUndefined();
		expect(listApiKeys(db)).toEqual([]);
	});
});
