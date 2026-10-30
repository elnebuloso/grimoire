import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { DatabaseSync } from 'node:sqlite';
import { openDatabase } from '#lib/server/db/schema.js';
import { replaceSourceIndex } from '#lib/server/db/sources.js';
import { chunkPage } from '#lib/server/parsing/chunk.js';
import { splitCode } from '#lib/server/parsing/markdown.js';
import { preprocessPage } from '#lib/server/parsing/preprocess.js';
import { createApiKey } from '#lib/server/api-keys.js';
import { agentInstructions } from '#lib/server/agent/operations.js';
import { log } from '#lib/server/log.js';
import { listMissedQueries } from '#lib/server/missed-queries.js';
import { GET as sources } from './sources/+server';
import { GET as query } from './query/+server';
import { GET as instructions } from './instructions/+server';
import { GET as sourceIndex } from './sources/[source]/+server';
import { GET as llmsTxt } from './sources/[source]/llms.txt/+server';
import { GET as page } from './p/[source]/[...page]/+server';
import { POST as mcp, fallback as mcpOtherMethod } from './mcp/+server';

// Each route types its own event; `never` lets one helper call all of them.
type RouteHandler = (event: never) => Response | Promise<Response>;

let db: DatabaseSync;
let allKey: string;
let billingKey: string;

// The real accessor opens the file from the environment; the routes get an in-memory database.
vi.mock('#lib/server/db/index.js', () => ({ database: () => db }));
vi.mock('$app/env/private', () => ({ TZ: 'UTC', BASE_URL: '' }));

function newKey(name: string, sources: 'all' | string[]): string {
	const created = createApiKey(db, name, sources);
	if ('error' in created) throw new Error(created.error);
	return created.key;
}

function addSource(source: string, description: string, file: string, markdown: string) {
	const sourceId = Number(
		db
			.prepare(
				`INSERT INTO sources (slug, description, git_url, branch, path)
				VALUES (?, ?, 'https://git.example/x.git', 'main', 'docs/')`
			)
			.run(source, description).lastInsertRowid
	);
	const metadata = preprocessPage(markdown);
	const chunked = chunkPage(metadata, file);
	const searchTexts = chunked.snippets.map((snippet) => splitCode(snippet.content));
	replaceSourceIndex(db, sourceId, {
		commit: 'abc',
		links: [],
		warnings: [],
		pages: [{ file, metadata, chunked, searchTexts }]
	});
}

const words = Array(60).fill('word').join(' ');

beforeEach(() => {
	db = openDatabase(':memory:');
	addSource(
		'platform-docs',
		'Login and gateway',
		'run books/deploy.md',
		`# Deploy\n\nOverview.\n\n## Rollback\n\nRollback ${words}\n\n## Upgrade\n\nUpgrade ${words}\n`
	);
	addSource('billing-docs', '', 'index.md', '# Invoices\n\nRollback of invoices.');
	allKey = newKey('all', 'all');
	billingKey = newKey('billing', ['billing-docs']);
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
		[sources, '/sources', {}],
		[query, '/query?q=rollback', {}],
		[instructions, '/instructions', {}],
		[sourceIndex, '/sources/platform-docs', { source: 'platform-docs' }],
		[llmsTxt, '/sources/platform-docs/llms.txt', { source: 'platform-docs' }],
		[
			page,
			'/p/platform-docs/run%20books/deploy',
			{ source: 'platform-docs', page: 'run books/deploy' }
		]
	];

	it.each(routes)('answers in Markdown with a valid key: %#', async (handler, path, params) => {
		const response = await get(handler, path, params);

		expect(response.status).toBe(200);
		expect(response.type).toBe('text/markdown; charset=utf-8');
	});

	it.each(routes)(
		'answers a server error in Markdown and logs it: %#',
		async (handler, path, params) => {
			const logError = vi.spyOn(log, 'error').mockImplementation(() => {});
			db.close();

			const response = await get(handler, path, params);

			expect(response.status).toBe(500);
			expect(response.type).toBe('text/markdown; charset=utf-8');
			expect(logError).toHaveBeenCalledOnce();
			logError.mockRestore();
		}
	);

	it.each(routes)('rejects a missing or unknown key: %#', async (handler, path, params) => {
		for (const key of [null, 'grimoire_unknown']) {
			const response = await get(handler, path, params, key);

			expect(response.status).toBe(401);
			expect(response.type).toBe('text/markdown; charset=utf-8');
			expect(response.body).toContain('Authorization: Bearer');
		}
	});
});

describe('public sources', () => {
	beforeEach(() => {
		db.prepare("UPDATE sources SET public = 1 WHERE slug = 'platform-docs'").run();
	});

	it('lists, searches and reads only the public sources without a key', async () => {
		expect((await get(sources, '/sources', {}, null)).body).toBe(
			'- platform-docs: Login and gateway'
		);

		const found = await get(query, '/query?q=rollback', {}, null);
		expect(found.body).toContain('Source: platform-docs/run books/deploy#rollback');
		expect(found.body).not.toContain('billing-docs');

		const hidden = await get(
			sourceIndex,
			'/sources/billing-docs',
			{ source: 'billing-docs' },
			null
		);
		expect(hidden.status).toBe(404);
		const page = await get(
			sourceIndex,
			'/sources/platform-docs',
			{ source: 'platform-docs' },
			null
		);
		expect(page.status).toBe(200);
	});

	it('adds the public sources to a key limited to others', async () => {
		const listed = await get(sources, '/sources', {}, billingKey);

		expect(listed.body).toBe('- billing-docs\n- platform-docs: Login and gateway');
	});

	it('still rejects an unknown key', async () => {
		expect((await get(sources, '/sources', {}, 'grimoire_unknown')).status).toBe(401);
	});

	it('does not record a query without a key that found nothing', async () => {
		await get(query, '/query?q=kubernetes', {}, null);

		expect(listMissedQueries(db)).toEqual([]);
	});
});

describe('GET /sources', () => {
	it('lists only the sources in the key scope', async () => {
		expect((await get(sources, '/sources')).body).toBe(
			'- billing-docs\n- platform-docs: Login and gateway'
		);
		expect((await get(sources, '/sources', {}, billingKey)).body).toBe('- billing-docs');
	});
});

describe('GET /instructions', () => {
	it('returns the agent instructions', async () => {
		expect((await get(instructions, '/instructions')).body).toBe(agentInstructions);
	});
});

describe('GET /query', () => {
	it('searches all sources in scope', async () => {
		expect((await get(query, '/query?q=rollback')).body).toContain('Source: platform-docs/');
		expect((await get(query, '/query?q=rollback', {}, billingKey)).body).not.toContain(
			'platform-docs'
		);
	});

	it('searches only the sources given with ?source=, repeated for several', async () => {
		const one = await get(query, '/query?q=rollback&source=billing-docs');
		const both = await get(query, '/query?q=rollback&source=billing-docs&source=platform-docs');

		expect(one.body).toContain('Source: billing-docs/index');
		expect(one.body).not.toContain('platform-docs');
		expect(both.body).toContain('Source: billing-docs/index');
		expect(both.body).toContain('Source: platform-docs/');
	});

	it('answers 404 when a given source is unknown or out of scope', async () => {
		const unknown = await get(query, '/query?q=rollback&source=billing-docs&source=nope');
		const hidden = await get(query, '/query?q=rollback&source=platform-docs', {}, billingKey);

		expect(unknown.status).toBe(404);
		expect(unknown.body).toContain('Source "nope" not found');
		expect(hidden).toEqual({ ...unknown, body: unknown.body.replace('nope', 'platform-docs') });
	});

	it('keeps to the token budget', async () => {
		const small = await get(query, '/query?q=rollback&tokens=60');
		const large = await get(query, '/query?q=rollback&tokens=3000');

		expect(small.body.length).toBeLessThan(large.body.length);
	});

	it('records a query without results for the admins, and only such a query', async () => {
		await get(query, '/query?q=rollback');
		await get(query, '/query?q=release+process');
		await get(query, '/query?q=vpn&source=platform-docs&source=billing-docs');
		// An unknown source is a wrong request, not missing documentation.
		await get(query, '/query?q=vpn&source=nope');

		const recorded = listMissedQueries(db).map(({ question, sources }) => ({ question, sources }));
		// Both were asked within the same millisecond, so the order between them is not fixed.
		expect(recorded).toHaveLength(2);
		expect(recorded).toEqual(
			expect.arrayContaining([
				{ question: 'release process', sources: null },
				{ question: 'vpn', sources: 'billing-docs, platform-docs' }
			])
		);
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

describe('GET /sources/<source>', () => {
	it('lists the pages and sections of the source', async () => {
		const response = await get(sourceIndex, '/sources/platform-docs', { source: 'platform-docs' });

		expect(response.status).toBe(200);
		expect(response.body).toContain('platform-docs/run books/deploy#upgrade: Upgrade');
	});

	it('treats a source out of scope like an unknown one', async () => {
		const unknown = await get(sourceIndex, '/sources/nope', { source: 'nope' });
		const hidden = await get(
			sourceIndex,
			'/sources/platform-docs',
			{ source: 'platform-docs' },
			billingKey
		);

		expect(unknown.status).toBe(404);
		expect(hidden).toEqual({ ...unknown, body: unknown.body.replace('nope', 'platform-docs') });
		expect(
			(
				await get(
					llmsTxt,
					'/sources/platform-docs/llms.txt',
					{ source: 'platform-docs' },
					billingKey
				)
			).status
		).toBe(404);
	});

	it('links llms.txt to the page routes of this server', async () => {
		expect(
			(await get(llmsTxt, '/sources/platform-docs/llms.txt', { source: 'platform-docs' })).body
		).toContain('- [Deploy](https://grimoire.example/p/platform-docs/run%20books/deploy)');
	});
});

describe('GET /p/<source>/<page>', () => {
	const params = { source: 'platform-docs', page: 'run books/deploy' };

	it('returns the whole page, or one section with ?section=', async () => {
		const whole = await get(page, '/p/platform-docs/run%20books/deploy', params);
		const section = await get(page, '/p/platform-docs/run%20books/deploy?section=upgrade', params);

		expect(whole.body).toContain('Rollback');
		expect(whole.body).toContain('Upgrade');
		expect(section.status).toBe(200);
		expect(section.body).toContain('Source: platform-docs/run books/deploy#upgrade');
		expect(section.body).not.toContain('Rollback');
	});

	it('returns 404 for an unknown page or section, and for a source out of scope', async () => {
		const unknownPage = await get(page, '/p/platform-docs/nope', { ...params, page: 'nope' });
		const unknownSection = await get(
			page,
			'/p/platform-docs/run%20books/deploy?section=nope',
			params
		);
		const hidden = await get(page, '/p/platform-docs/run%20books/deploy', params, billingKey);

		expect(unknownPage.status).toBe(404);
		expect(unknownPage.body).toContain('"platform-docs/nope" not found');
		expect(unknownSection.status).toBe(404);
		expect(unknownSection.type).toBe('text/markdown; charset=utf-8');
		expect(hidden.status).toBe(404);
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

	async function tool(name: string, args: object = {}, key: string | null = allKey) {
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

	it('answers without a key within the public sources once there is one', async () => {
		db.prepare("UPDATE sources SET public = 1 WHERE slug = 'billing-docs'").run();

		expect(await tool('sources', {}, null)).toEqual({ error: false, text: '- billing-docs' });
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
			'sources',
			'index',
			'query',
			'read'
		]);
	});

	it('answers each tool in Markdown within the key scope', async () => {
		expect(await tool('sources', {}, billingKey)).toEqual({ error: false, text: '- billing-docs' });
		expect((await tool('index', { source: 'platform-docs' })).text).toContain(
			'platform-docs/run books/deploy#upgrade: Upgrade'
		);
		expect((await tool('query', { query: 'rollback', tokens: 3000 })).text).toContain(
			'Source: platform-docs/'
		);
		expect((await tool('query', { query: 'rollback' }, billingKey)).text).not.toContain(
			'platform-docs'
		);
		expect(listMissedQueries(db)).toEqual([]);
		await tool('query', { query: 'release process', sources: ['platform-docs'] });
		expect(listMissedQueries(db)).toMatchObject([
			{ question: 'release process', sources: 'platform-docs', count: 1 }
		]);
	});

	it('searches only the sources given as a list, and fails for one out of scope', async () => {
		const both = await tool('query', {
			query: 'rollback',
			sources: ['billing-docs', 'platform-docs']
		});
		const one = await tool('query', { query: 'rollback', sources: ['billing-docs'] });
		const hidden = await tool(
			'query',
			{ query: 'rollback', sources: ['platform-docs'] },
			billingKey
		);

		expect(both.text).toContain('Source: billing-docs/index');
		expect(both.text).toContain('Source: platform-docs/');
		expect(one.text).not.toContain('platform-docs');
		expect(hidden).toEqual({
			error: true,
			text: 'Source "platform-docs" not found. See `sources`.'
		});
	});

	it('reads a section by an ID with #anchor', async () => {
		const section = await tool('read', { id: 'platform-docs/run books/deploy#upgrade' });

		expect(section.error).toBe(false);
		expect(section.text).toContain('Source: platform-docs/run books/deploy#upgrade');
		expect(section.text).not.toContain('Rollback');
	});

	it('reports unknown and out-of-scope IDs alike as a tool error', async () => {
		const unknown = await tool('index', { source: 'nope' });
		const hidden = await tool('index', { source: 'platform-docs' }, billingKey);

		expect(unknown.error).toBe(true);
		expect(hidden).toEqual({ ...unknown, text: unknown.text.replace('nope', 'platform-docs') });
		expect((await tool('read', { id: 'platform-docs/nope' })).error).toBe(true);
		expect((await tool('read', { id: 'platform-docs/run books/deploy' }, billingKey)).error).toBe(
			true
		);
		expect(await tool('read', { id: 'platform-docs' })).toEqual({
			error: true,
			text: expect.stringContaining('"platform-docs" not found')
		});
	});

	it('answers an unexpected error with the neutral text and logs it, never the error itself', async () => {
		const logError = vi.spyOn(log, 'error').mockImplementation(() => {});
		db.exec('ALTER TABLE snippets RENAME TO snippets_gone');

		const result = await tool('query', { query: 'rollback' });

		expect(result).toEqual({ error: true, text: 'The server failed to answer. Try again later.' });
		expect(logError).toHaveBeenCalledWith(
			{ err: expect.objectContaining({ message: expect.stringContaining('snippets') }) },
			'MCP tool query failed'
		);
		logError.mockRestore();
	});

	it('answers an unexpected error outside the tools like the HTTP API', async () => {
		const logError = vi.spyOn(log, 'error').mockImplementation(() => {});
		db.exec('ALTER TABLE api_keys RENAME TO api_keys_gone');

		const response = await call('tools/list');

		expect(response.status).toBe(500);
		expect(await response.text()).toBe('The server failed to answer. Try again later.');
		expect(logError).toHaveBeenCalledWith(
			{ err: expect.objectContaining({ message: expect.stringContaining('api_keys') }) },
			'POST /mcp failed'
		);
		logError.mockRestore();
	});

	it('reads the whole page for an empty anchor, like an empty section over HTTP', async () => {
		const id = 'platform-docs/run books/deploy';
		const viaMcp = await tool('read', { id: `${id}#` });
		const viaHttp = await get(page, '/p/platform-docs/run%20books/deploy?section=', {
			source: 'platform-docs',
			page: 'run books/deploy'
		});

		expect(viaMcp).toEqual({ error: false, text: (await tool('read', { id })).text });
		expect(viaHttp.body).toBe(viaMcp.text);
	});
});

describe('other methods on /mcp', () => {
	it.each(['GET', 'DELETE'])(
		'answers %s with 405, so no event stream is left open',
		async (method) => {
			const request = new Request('https://grimoire.example/mcp', {
				method,
				headers: { Accept: 'text/event-stream', Authorization: `Bearer ${allKey}` }
			});

			const response = await mcpOtherMethod({ request } as never);

			expect(response.status).toBe(405);
			expect(response.headers.get('Allow')).toBe('POST');
			expect(response.headers.get('Content-Type')).not.toContain('text/event-stream');
		}
	);
});
