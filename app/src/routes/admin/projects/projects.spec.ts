import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { DatabaseSync } from 'node:sqlite';
import { isHttpError, isRedirect } from '@sveltejs/kit';
import { openDatabase } from '#lib/server/db/schema.js';
import * as projectPage from './[id]/+page.server';
import * as sourcePage from './[id]/sources/[sourceId]/+page.server';

let db: DatabaseSync;
// vi.mock is hoisted above the imports; the mock it returns has to be hoisted with it.
const requestSync = vi.hoisted(() => vi.fn(async () => ({ status: 'unchanged', commit: 'abc' })));

vi.mock('#lib/server/db/index.js', () => ({ database: () => db }));
vi.mock('#lib/server/sync/index.js', () => ({ requestSync }));
vi.mock('$app/env/private', () => ({
	TOKEN_ENCRYPTION_KEY: Buffer.alloc(32, 7),
	SYNC_SCHEDULE: '*/5 * * * *'
}));

const TOKEN = 'glpat-very-secret';

function formRequest(fields: Record<string, string>) {
	return new Request('https://grimoire.example/admin/projects', {
		method: 'POST',
		body: new URLSearchParams(fields)
	});
}

/** Runs a handler that ends by throwing a redirect or an HTTP error, and returns what it threw. */
async function thrown(run: () => unknown): Promise<unknown> {
	try {
		await run();
	} catch (error) {
		return error;
	}
	throw new Error('expected the handler to throw');
}

function addProject(slug: string) {
	db.prepare('INSERT INTO projects (slug) VALUES (?)').run(slug);
}

async function saveProject(id: string, fields: Record<string, string>) {
	return projectPage.actions.save({ request: formRequest(fields), params: { id } } as never);
}

async function saveSource(id: string, sourceId: string, fields: Record<string, string>) {
	return sourcePage.actions.save({
		request: formRequest(fields),
		params: { id, sourceId }
	} as never);
}

function loadSource(id: string, sourceId: string, search = '') {
	return sourcePage.load({
		params: { id, sourceId },
		url: new URL(`https://grimoire.example/admin/projects/${id}/sources/${sourceId}${search}`)
	} as never);
}

const SOURCE = {
	slug: 'auth-service',
	gitUrl: 'https://gitlab.example.com/platform/auth.git',
	branch: 'main',
	path: 'docs/',
	exclusions: '',
	schedule: '',
	username: 'deploy',
	token: TOKEN
};

beforeEach(() => {
	db = openDatabase(':memory:');
	requestSync.mockClear();
});

describe('project page', () => {
	it('saves a project and redirects to its page', async () => {
		addProject('platform');
		const result = await thrown(() => saveProject('1', { slug: 'platform', description: 'P' }));

		expect(isRedirect(result) && [result.status, result.location]).toEqual([
			303,
			'/admin/projects/1'
		]);
		expect(projectPage.load({ params: { id: '1' } } as never)).toMatchObject({
			project: { id: 1, slug: 'platform', description: 'P' },
			sources: []
		});
	});

	it('answers a duplicate slug with 400, the message and the entered values', async () => {
		addProject('platform');
		addProject('billing');
		const result = await saveProject('2', { slug: 'platform', description: 'again' });

		expect(result).toMatchObject({
			status: 400,
			data: {
				error: 'A project with the slug "platform" already exists.',
				values: { slug: 'platform', description: 'again' }
			}
		});
	});

	it('answers an unknown or malformed id with 404', async () => {
		// `new` is the wizard's route, not this page.
		for (const id of ['7', 'abc', 'new']) {
			const result = await thrown(() => projectPage.load({ params: { id } } as never));

			expect(isHttpError(result) && result.status).toBe(404);
		}
	});

	it('deletes the project with its sources', async () => {
		addProject('platform');
		await thrown(() => saveSource('1', 'new', SOURCE));
		const result = await thrown(() => projectPage.actions.delete({ params: { id: '1' } } as never));

		expect(isRedirect(result) && result.location).toBe('/admin');
		expect(db.prepare('SELECT count(*) AS n FROM sources').get()).toEqual({ n: 0 });
	});
});

describe('source page', () => {
	beforeEach(() => {
		addProject('platform');
	});

	it('creates a source, requests a forced sync and redirects to its page', async () => {
		const result = await thrown(() => saveSource('1', 'new', SOURCE));

		expect(isRedirect(result) && [result.status, result.location]).toEqual([
			303,
			'/admin/projects/1/sources/1'
		]);
		expect(requestSync).toHaveBeenCalledExactlyOnceWith(1, { force: true });
	});

	it('never puts the token into page data', async () => {
		await thrown(() => saveSource('1', 'new', SOURCE));

		const data = [
			loadSource('1', '1'),
			projectPage.load({ params: { id: '1' } } as never),
			await saveSource('1', 'new', SOURCE)
		];

		expect(data[0]).toMatchObject({ source: { username: 'deploy', hasToken: true } });
		expect(data[2]).toMatchObject({ status: 400 });
		const stored = db.prepare('SELECT encrypted_token FROM sources').get() as {
			encrypted_token: string;
		};
		for (const page of data) {
			expect(JSON.stringify(page)).not.toContain(TOKEN);
			expect(JSON.stringify(page)).not.toContain(stored.encrypted_token);
		}
	});

	it('sends a rejected Git URL back without its credentials', async () => {
		const result = await saveSource('1', 'new', {
			...SOURCE,
			gitUrl: 'https://user:hunter2@gitlab.example.com/a.git'
		});

		expect(result).toMatchObject({
			status: 400,
			data: { values: { gitUrl: 'https://gitlab.example.com/a.git' } }
		});
	});

	it('answers a source of another project with 404', async () => {
		await thrown(() => saveSource('1', 'new', SOURCE));
		addProject('other');

		const result = await thrown(() => loadSource('2', '1'));

		expect(isHttpError(result) && result.status).toBe(404);
	});

	it('syncs now, forced, and returns the result', async () => {
		await thrown(() => saveSource('1', 'new', SOURCE));
		requestSync.mockClear();

		const result = await sourcePage.actions.sync({
			params: { id: '1', sourceId: '1' }
		} as never);

		expect(requestSync).toHaveBeenCalledExactlyOnceWith(1, { force: true });
		expect(result).toEqual({ sync: { status: 'unchanged', commit: 'abc' } });
	});

	it('shows the status and the preview of a page the query names', async () => {
		await thrown(() => saveSource('1', 'new', SOURCE));
		const page = db
			.prepare(
				`INSERT INTO pages (source_id, file, title, content) VALUES (1, 'deploy.md', 'Deploy', '')`
			)
			.run().lastInsertRowid;
		db.prepare(
			`INSERT INTO snippets (page_id, position, title_path, content, tokens)
			VALUES (?, 0, '["Deploy"]', 'Run make deploy.', 4)`
		).run(page);

		const data = loadSource('1', '1', '?preview=deploy.md');

		expect(data).toMatchObject({
			status: { totals: { pages: 1, snippets: 1, tokens: 4 } },
			preview: { file: 'deploy.md', markdown: expect.stringContaining('Run make deploy.') }
		});
		expect(loadSource('1', '1')).toMatchObject({ preview: undefined });
	});

	it('deletes the source and redirects to the project', async () => {
		await thrown(() => saveSource('1', 'new', SOURCE));
		const result = await thrown(() =>
			sourcePage.actions.delete({ params: { id: '1', sourceId: '1' } } as never)
		);

		expect(isRedirect(result) && result.location).toBe('/admin/projects/1');
		expect(db.prepare('SELECT count(*) AS n FROM sources').get()).toEqual({ n: 0 });
	});
});
