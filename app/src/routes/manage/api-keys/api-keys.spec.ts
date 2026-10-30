import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest';
import type { DatabaseSync } from 'node:sqlite';
import { openDatabase } from '#lib/server/db/schema.js';
import { isHttpError } from '@sveltejs/kit';
import { listApiKeys, revokeApiKey, scopeForKey } from '#lib/server/api-keys.js';
import * as page from './+page.server';

let db: DatabaseSync;

vi.mock('#lib/server/db/index.js', () => ({ database: () => db }));
vi.mock('$app/env/private', () => ({ TZ: 'UTC' }));

const CLOCK = { now: new Date('2026-10-30T12:00:00.000Z'), today: '2026-10-30' };

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
	vi.useFakeTimers({ toFake: ['Date'] });
	vi.setSystemTime(CLOCK.now);
	db = openDatabase(':memory:');
	db.exec(`INSERT INTO projects (slug) VALUES ('billing'), ('platform')`);
});

afterEach(() => {
	vi.useRealTimers();
});

describe('create', () => {
	it('returns the key once, scoped to the selected projects, and lists it without the key', async () => {
		const result = (await create([
			['name', ' ci '],
			['scope', 'selected'],
			['projects', 'platform']
		])) as { created: { name: string; key: string } };

		expect(result.created.name).toBe('ci');
		expect(scopeForKey(db, result.created.key, CLOCK)).toEqual({ scope: ['platform'] });
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

		expect(scopeForKey(db, result.created.key, CLOCK)).toEqual({ scope: 'all' });
	});

	it('creates a key valid until a date, shown as expired once the date has passed', async () => {
		await create([
			['name', 'trial'],
			['scope', 'all'],
			['validUntil', '2026-10-30']
		]);
		expect(page.load({} as never)).toMatchObject({
			keys: [{ name: 'trial', validUntil: '2026-10-30', expired: false, lastUsedAt: null }],
			today: '2026-10-30'
		});

		vi.setSystemTime(new Date('2026-10-31T00:00:00.000Z'));
		expect(page.load({} as never)).toMatchObject({ keys: [{ expired: true }] });
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
		],
		[
			[
				['name', 'ci'],
				['scope', 'all'],
				['validUntil', '30.11.2026']
			],
			'Enter the date as YYYY-MM-DD.'
		],
		[
			[
				['name', 'ci'],
				['scope', 'all'],
				['validUntil', '2026-10-29']
			],
			'The date must be today or later.'
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

		expect(scopeForKey(db, created.key, CLOCK)).toBeUndefined();
		expect(listApiKeys(db)).toEqual([]);
	});
});

describe('update', () => {
	async function update(fields: [string, string][]) {
		return page.actions.update({ request: formRequest(fields) } as never);
	}

	it('changes scope and expiry of a key that keeps working', async () => {
		const { created } = (await create([
			['name', 'ci'],
			['scope', 'all']
		])) as { created: { key: string } };
		const [{ id }] = listApiKeys(db);

		expect(
			await update([
				['id', String(id)],
				['scope', 'selected'],
				['projects', 'billing'],
				['validUntil', '2026-12-31']
			])
		).toEqual({ updated: id });

		expect(scopeForKey(db, created.key, CLOCK)).toEqual({ scope: ['billing'] });
		expect(listApiKeys(db)[0].validUntil).toBe('2026-12-31');

		await update([
			['id', String(id)],
			['scope', 'all'],
			['validUntil', '']
		]);
		expect(listApiKeys(db)[0]).toMatchObject({ projects: 'all', validUntil: null });
	});

	it('rejects an invalid change for that key and keeps what the form sent', async () => {
		await create([
			['name', 'ci'],
			['scope', 'all']
		]);
		const [{ id }] = listApiKeys(db);

		expect(
			await update([
				['id', String(id)],
				['scope', 'selected']
			])
		).toMatchObject({
			status: 400,
			data: {
				update: {
					id,
					error: 'Choose all projects or at least one.',
					values: { allProjects: false, projects: [], validUntil: '' }
				}
			}
		});
		expect(
			await update([
				['id', String(id)],
				['scope', 'selected'],
				['projects', 'gone']
			])
		).toMatchObject({
			status: 400,
			data: { update: { error: 'A selected project no longer exists.' } }
		});
		expect(listApiKeys(db)[0].projects).toBe('all');
	});

	it('answers 404 for a key that no longer exists, and changes nothing', async () => {
		await create([
			['name', 'ci'],
			['scope', 'all']
		]);
		const [{ id }] = listApiKeys(db);
		revokeApiKey(db, id);

		// The revoked id, one that is not a number, and none at all.
		for (const idFields of [[['id', String(id)]], [['id', 'x']], []] as [string, string][][]) {
			const thrown = await update([
				...idFields,
				['scope', 'selected'],
				['projects', 'billing']
			]).catch((error: unknown) => error);
			expect(isHttpError(thrown, 404)).toBe(true);
		}
		expect(db.prepare('SELECT count(*) AS n FROM api_key_projects').get()).toEqual({ n: 0 });
	});
});

describe('a broken database', () => {
	it('is not reported as a deleted project', async () => {
		db.close();

		await expect(
			create([
				['name', 'ci'],
				['scope', 'all']
			])
		).rejects.toThrow();
		await expect(
			page.actions.update({
				request: formRequest([
					['id', '1'],
					['scope', 'all']
				])
			} as never)
		).rejects.toThrow();
	});
});
