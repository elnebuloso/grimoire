import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { DatabaseSync } from 'node:sqlite';
import { openDatabase } from '#lib/server/db/schema.js';
import { replaceSourceIndex } from '#lib/server/db/sources.js';
import { chunkPage } from '#lib/server/parsing/chunk.js';
import { preprocessPage } from '#lib/server/parsing/preprocess.js';
import { createApiKey } from '#lib/server/api-keys.js';
import { agentInstructions } from '#lib/server/agent/operations.js';
import { GET as projects } from './projects/+server';
import { GET as query } from './query/+server';
import { GET as instructions } from './instructions/+server';
import { GET as projectIndex } from './p/[project]/index/+server';
import { GET as llmsTxt } from './p/[project]/llms.txt/+server';
import { GET as projectQuery } from './p/[project]/query/+server';
import { GET as page } from './p/[project]/[source]/[...page]/+server';
import { fallback as mcp } from './mcp/+server';

// Each route types its own event; `never` lets one helper call all of them.
type RouteHandler = (event: never) => Response | Promise<Response>;

let db: DatabaseSync;
let allKey: string;
let billingKey: string;

// The real accessor opens the file from the environment; the routes get an in-memory database.
vi.mock('#lib/server/db/index.js', () => ({ database: () => db }));

function addSource(
	project: string,
	description: string,
	source: string,
	file: string,
	markdown: string
) {
	const projectId = Number(
		db.prepare('INSERT INTO projects (slug, description) VALUES (?, ?)').run(project, description)
			.lastInsertRowid
	);
	const sourceId = Number(
		db
			.prepare(
				`INSERT INTO sources (project_id, slug, git_url, branch, path)
				VALUES (?, ?, 'https://git.example/x.git', 'main', 'docs/')`
			)
			.run(projectId, source).lastInsertRowid
	);
	const metadata = preprocessPage(markdown);
	replaceSourceIndex(db, sourceId, {
		commit: 'abc',
		links: [],
		warnings: [],
		pages: [{ file, metadata, chunked: chunkPage(metadata, { project, source, file }) }]
	});
}

const words = Array(60).fill('word').join(' ');

beforeEach(() => {
	db = openDatabase(':memory:');
	addSource(
		'platform',
		'Login and gateway',
		'auth',
		'run books/deploy.md',
		`# Deploy\n\nOverview.\n\n## Rollback\n\nRollback ${words}\n\n## Upgrade\n\nUpgrade ${words}\n`
	);
	addSource('billing', '', 'invoices', 'index.md', '# Invoices\n\nRollback of invoices.');
	allKey = createApiKey(db, 'all', 'all').key;
	billingKey = createApiKey(db, 'billing', ['billing']).key;
});

async function get(
	handler: RouteHandler,
	path: string,
	params: Record<string, string> = {},
	key: string | null = allKey
) {
	const url = new URL(path, 'https://grimoire.example');
	const request = new Request(url, { headers: key ? { Authorization: `Bearer ${key}` } : {} });
	const response = await handler({ request, url, params } as never);
	return {
		status: response.status,
		type: response.headers.get('Content-Type'),
		body: await response.text()
	};
}

describe('every route', () => {
	const routes: [RouteHandler, string, Record<string, string>][] = [
		[projects, '/projects', {}],
		[query, '/query?q=rollback', {}],
		[instructions, '/instructions', {}],
		[projectIndex, '/p/platform/index', { project: 'platform' }],
		[llmsTxt, '/p/platform/llms.txt', { project: 'platform' }],
		[projectQuery, '/p/platform/query?q=rollback', { project: 'platform' }],
		[
			page,
			'/p/platform/auth/run%20books/deploy',
			{ project: 'platform', source: 'auth', page: 'run books/deploy' }
		]
	];

	it.each(routes)('answers in Markdown with a valid key: %#', async (handler, path, params) => {
		const response = await get(handler, path, params);

		expect(response.status).toBe(200);
		expect(response.type).toBe('text/markdown; charset=utf-8');
	});

	it.each(routes)('rejects a missing or unknown key: %#', async (handler, path, params) => {
		for (const key of [null, 'grimoire_unknown']) {
			const response = await get(handler, path, params, key);

			expect(response.status).toBe(401);
			expect(response.type).toBe('text/markdown; charset=utf-8');
			expect(response.body).toContain('Authorization: Bearer');
		}
	});
});

describe('GET /projects', () => {
	it('lists only the projects in the key scope', async () => {
		expect((await get(projects, '/projects')).body).toBe(
			'- billing\n- platform: Login and gateway'
		);
		expect((await get(projects, '/projects', {}, billingKey)).body).toBe('- billing');
	});
});

describe('GET /instructions', () => {
	it('returns the agent instructions', async () => {
		expect((await get(instructions, '/instructions')).body).toBe(agentInstructions);
	});
});

describe('GET /query', () => {
	it('searches all projects in scope', async () => {
		expect((await get(query, '/query?q=rollback')).body).toContain('Source: platform/auth/');
		expect((await get(query, '/query?q=rollback', {}, billingKey)).body).not.toContain('platform');
	});

	it('keeps to the token budget', async () => {
		const small = await get(query, '/query?q=rollback&tokens=60');
		const large = await get(query, '/query?q=rollback&tokens=3000');

		expect(small.body.length).toBeLessThan(large.body.length);
	});

	it.each(['/query', '/query?q=%20', '/query?q=x&tokens=0', '/query?q=x&tokens=many'])(
		'rejects %s with 400',
		async (path) => {
			const response = await get(query, path);

			expect(response.status).toBe(400);
			expect(response.type).toBe('text/markdown; charset=utf-8');
		}
	);
});

describe('GET /p/<project>/…', () => {
	it('treats a project out of scope like an unknown one', async () => {
		const unknown = await get(projectIndex, '/p/nope/index', { project: 'nope' });
		const hidden = await get(
			projectIndex,
			'/p/platform/index',
			{ project: 'platform' },
			billingKey
		);

		expect(unknown.status).toBe(404);
		expect(hidden).toEqual({ ...unknown, body: unknown.body.replace('nope', 'platform') });
		expect(
			(await get(llmsTxt, '/p/platform/llms.txt', { project: 'platform' }, billingKey)).status
		).toBe(404);
		expect(
			(await get(projectQuery, '/p/platform/query?q=rollback', { project: 'platform' }, billingKey))
				.status
		).toBe(404);
	});

	it('links llms.txt to the page routes of this server', async () => {
		expect((await get(llmsTxt, '/p/platform/llms.txt', { project: 'platform' })).body).toContain(
			'- [Deploy](https://grimoire.example/p/platform/auth/run%20books/deploy)'
		);
	});

	it('searches one project only', async () => {
		const response = await get(projectQuery, '/p/billing/query?q=rollback', { project: 'billing' });

		expect(response.body).toContain('Source: billing/invoices/index');
		expect(response.body).not.toContain('platform');
	});
});

describe('GET /p/<project>/<source>/<page>', () => {
	const params = { project: 'platform', source: 'auth', page: 'run books/deploy' };

	it('returns the whole page, or one section with ?section=', async () => {
		const whole = await get(page, '/p/platform/auth/run%20books/deploy', params);
		const section = await get(page, '/p/platform/auth/run%20books/deploy?section=upgrade', params);

		expect(whole.body).toContain('Rollback');
		expect(whole.body).toContain('Upgrade');
		expect(section.status).toBe(200);
		expect(section.body).toContain('Source: platform/auth/run books/deploy#upgrade');
		expect(section.body).not.toContain('Rollback');
	});

	it('returns 404 for an unknown page or section', async () => {
		const unknownPage = await get(page, '/p/platform/auth/nope', { ...params, page: 'nope' });
		const unknownSection = await get(
			page,
			'/p/platform/auth/run%20books/deploy?section=nope',
			params
		);

		expect(unknownPage.status).toBe(404);
		expect(unknownPage.body).toContain('"platform/auth/nope" not found');
		expect(unknownSection.status).toBe(404);
		expect(unknownSection.type).toBe('text/markdown; charset=utf-8');
	});
});

describe('POST /mcp', () => {
	let id = 0;

	async function call(method: string, params: object = {}, key: string | null = allKey) {
		const headers: Record<string, string> = {
			'Content-Type': 'application/json',
			Accept: 'application/json, text/event-stream'
		};
		if (key) headers.Authorization = `Bearer ${key}`;
		const request = new Request('https://grimoire.example/mcp', {
			method: 'POST',
			headers,
			body: JSON.stringify({ jsonrpc: '2.0', id: ++id, method, params })
		});
		return mcp({ request } as never);
	}

	async function tool(name: string, args: object = {}, key = allKey) {
		const { result } = await (await call('tools/call', { name, arguments: args }, key)).json();
		return { error: result.isError as boolean, text: result.content[0].text as string };
	}

	it('rejects a missing or unknown key before any MCP message', async () => {
		for (const key of [null, 'grimoire_unknown']) {
			const response = await call('tools/list', {}, key);

			expect(response.status).toBe(401);
			expect(response.headers.get('WWW-Authenticate')).toBe('Bearer');
		}
	});

	it('sends the agent instructions on initialize', async () => {
		const response = await call('initialize', {
			protocolVersion: '2025-06-18',
			capabilities: {},
			clientInfo: { name: 'test', version: '1' }
		});

		expect((await response.json()).result.instructions).toBe(agentInstructions);
	});

	it('offers the four operations as tools', async () => {
		const { result } = await (await call('tools/list')).json();

		expect(result.tools.map((entry: { name: string }) => entry.name)).toEqual([
			'projects',
			'index',
			'query',
			'read'
		]);
	});

	it('answers each tool in Markdown within the key scope', async () => {
		expect(await tool('projects', {}, billingKey)).toEqual({ error: false, text: '- billing' });
		expect((await tool('index', { project: 'platform' })).text).toContain(
			'platform/auth/run books/deploy#upgrade: Upgrade'
		);
		expect((await tool('query', { query: 'rollback', tokens: 3000 })).text).toContain(
			'Source: platform/auth/'
		);
		expect((await tool('query', { query: 'rollback' }, billingKey)).text).not.toContain('platform');
	});

	it('reads a section by an ID with #anchor', async () => {
		const section = await tool('read', { id: 'platform/auth/run books/deploy#upgrade' });

		expect(section.error).toBe(false);
		expect(section.text).toContain('Source: platform/auth/run books/deploy#upgrade');
		expect(section.text).not.toContain('Rollback');
	});

	it('reports unknown and out-of-scope IDs alike as a tool error', async () => {
		const unknown = await tool('index', { project: 'nope' });
		const hidden = await tool('index', { project: 'platform' }, billingKey);

		expect(unknown.error).toBe(true);
		expect(hidden).toEqual({ ...unknown, text: unknown.text.replace('nope', 'platform') });
		expect((await tool('read', { id: 'platform/auth/nope' })).error).toBe(true);
	});
});
