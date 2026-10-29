import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { DatabaseSync } from 'node:sqlite';
import { isRedirect } from '@sveltejs/kit';
import { openDatabase } from '#lib/server/db/schema.js';
import { decryptToken } from '#lib/server/token-encryption.js';
import * as wizard from './+page.server';

let db: DatabaseSync;
const KEY = vi.hoisted(() => Buffer.alloc(32, 7));
const TOKEN = 'glpat-very-secret';
const requestSync = vi.hoisted(() => vi.fn(async () => ({ status: 'unchanged', commit: 'abc' })));

vi.mock('#lib/server/db/index.js', () => ({ database: () => db }));
vi.mock('#lib/server/sync/index.js', () => ({ requestSync }));
vi.mock('$app/env/private', () => ({ TOKEN_ENCRYPTION_KEY: KEY, SYNC_SCHEDULE: '*/5 * * * *' }));

const FIELDS = {
	projectSlug: 'platform',
	description: 'Login and billing',
	sourceSlug: 'auth-service',
	gitUrl: 'https://gitlab.example.com/platform/auth.git',
	branch: 'main',
	path: 'docs/',
	exclusions: '',
	schedule: '',
	username: 'deploy',
	encryptedToken: ''
};

type Action = keyof typeof wizard.actions;

async function submit(action: Action, fields: Record<string, string>) {
	const request = new Request('https://grimoire.example/admin/projects/new', {
		method: 'POST',
		body: new URLSearchParams(fields)
	});
	try {
		return await wizard.actions[action]({ request } as never);
	} catch (thrown) {
		return thrown;
	}
}

/** Runs the steps up to the summary and returns the fields its form carries. */
async function throughSummary(fields: Record<string, string> = {}) {
	const result = (await submit('summary', { ...FIELDS, token: TOKEN, ...fields })) as {
		step: string;
		values: { encryptedToken: string };
	};
	expect(result.step).toBe('summary');
	return { ...FIELDS, ...fields, encryptedToken: result.values.encryptedToken };
}

function count(table: string): number {
	return (db.prepare(`SELECT count(*) AS n FROM ${table}`).get() as { n: number }).n;
}

beforeEach(() => {
	db = openDatabase(':memory:');
	requestSync.mockClear();
});

describe('project wizard', () => {
	it('stays on the project step with the error until the project data is valid', async () => {
		db.prepare("INSERT INTO projects (slug) VALUES ('platform')").run();

		expect(await submit('source', FIELDS)).toMatchObject({
			status: 400,
			data: {
				step: 'project',
				error: 'A project with the slug "platform" already exists.',
				values: { project: { slug: 'platform', description: 'Login and billing' } }
			}
		});
		expect(await submit('source', { ...FIELDS, projectSlug: 'billing' })).toMatchObject({
			step: 'source'
		});
	});

	it('shows a source problem on the source step and a project problem on the project step', async () => {
		expect(await submit('summary', { ...FIELDS, branch: ' ' })).toMatchObject({
			status: 400,
			data: { step: 'source', error: 'Enter the branch.' }
		});
		expect(await submit('summary', { ...FIELDS, projectSlug: 'Not A Slug' })).toMatchObject({
			status: 400,
			data: { step: 'project' }
		});
	});

	it('goes back without validating and keeps the values', async () => {
		expect(await submit('project', { ...FIELDS, branch: '' })).toEqual({
			step: 'project',
			values: {
				project: { slug: 'platform', description: 'Login and billing' },
				source: expect.objectContaining({ slug: 'auth-service', branch: '' }),
				encryptedToken: ''
			}
		});
	});

	it('carries the token only encrypted, keeps it when going back and drops it on request', async () => {
		const summary = await throughSummary();
		expect(decryptToken(summary.encryptedToken, KEY)).toBe(TOKEN);

		const back = await submit('source', summary);
		expect(JSON.stringify(back)).not.toContain(TOKEN);
		expect(back).toMatchObject({
			step: 'source',
			values: { encryptedToken: summary.encryptedToken }
		});

		const removed = await submit('summary', { ...summary, removeToken: 'on' });
		expect(removed).toMatchObject({ step: 'summary', values: { encryptedToken: '' } });
	});

	it('sends a rejected Git URL back without its credentials', async () => {
		const result = await submit('summary', {
			...FIELDS,
			gitUrl: `https://deploy:${TOKEN}@gitlab.example.com/platform/auth.git`
		});

		expect(result).toMatchObject({ status: 400, data: { step: 'source' } });
		expect(JSON.stringify(result)).not.toContain(TOKEN);
	});

	it('writes nothing before the summary is confirmed', async () => {
		await submit('source', FIELDS);
		await throughSummary();

		expect([count('projects'), count('sources')]).toEqual([0, 0]);
	});

	it('creates the project with its source, syncs it and redirects to the project', async () => {
		const result = await submit('create', await throughSummary());

		expect(isRedirect(result) && [result.status, result.location]).toEqual([
			303,
			'/admin/projects/1'
		]);
		const source = db
			.prepare('SELECT project_id, slug, username, encrypted_token FROM sources')
			.get() as { project_id: number; slug: string; username: string; encrypted_token: string };
		expect(source).toMatchObject({ project_id: 1, slug: 'auth-service', username: 'deploy' });
		expect(decryptToken(source.encrypted_token, KEY)).toBe(TOKEN);
		expect(requestSync).toHaveBeenCalledWith(1, { force: true });
	});

	it('creates nothing and returns to the project step when the slug was taken meanwhile', async () => {
		const summary = await throughSummary();
		db.prepare("INSERT INTO projects (slug) VALUES ('platform')").run();

		expect(await submit('create', summary)).toMatchObject({
			status: 400,
			data: { step: 'project', error: 'A project with the slug "platform" already exists.' }
		});
		expect([count('projects'), count('sources')]).toEqual([1, 0]);
		expect(requestSync).not.toHaveBeenCalled();
	});
});
