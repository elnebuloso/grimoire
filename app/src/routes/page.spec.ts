import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { DatabaseSync } from 'node:sqlite';
import { openDatabase } from '#lib/server/db/schema.js';
import { replaceSourceIndex } from '#lib/server/db/sources.js';
import { chunkPage } from '#lib/server/parsing/chunk.js';
import { splitCode } from '#lib/server/parsing/markdown.js';
import { preprocessPage } from '#lib/server/parsing/preprocess.js';
import { listMissedQueries } from '#lib/server/missed-queries.js';
import type { QueryFormState } from '#lib/server/query-form.js';
import { listVisibleSources } from '#lib/server/agent/operations.js';
import { createApiKey, scopeForKey } from '#lib/server/api-keys.js';
import { inScope } from '#lib/server/search/query.js';
import { sourceStats } from '#lib/server/stats.js';
import * as page from './+page.server';

let db: DatabaseSync;

vi.mock('#lib/server/db/index.js', () => ({ database: () => db }));
vi.mock('$app/env/private', () => ({
	TZ: 'UTC',
	BASE_URL: '',
	INSTANCE_TITLE: 'Acme Docs',
	INSTANCE_NAME: 'Acme Agents'
}));

function addSourceWithPage(slug: string, markdown: string, isPublic: boolean) {
	const sourceId = Number(
		db
			.prepare(
				`INSERT INTO sources (slug, name, git_url, branch, path, visibility)
				VALUES (?, 'Docs', 'https://git.internal.example/x.git', 'main', 'docs/', ?)`
			)
			.run(slug, isPublic ? 'public' : 'internal').lastInsertRowid
	);
	const metadata = preprocessPage(markdown);
	const chunked = chunkPage(metadata, 'index.md');
	const searchTexts = chunked.snippets.map((snippet) => splitCode(snippet.content));
	replaceSourceIndex(db, sourceId, {
		commit: 'abc',
		links: [],
		warnings: [],
		pages: [{ file: 'index.md', metadata, chunked, searchTexts }]
	});
}

function load(search: string, userId?: number) {
	const url = new URL(`https://grimoire.example/${search}`);
	const locals = userId ? { user: { id: userId } } : {};
	return page.load({ url, locals } as never) as {
		query?: QueryFormState;
		mcpName: string;
		sources: { rows: { slug: string; docsUrl: string | null }[] };
	};
}

beforeEach(() => {
	db = openDatabase(':memory:');
	addSourceWithPage('platform-docs', '# Rollback\n\nHow to roll back the platform.', false);
});

describe('what the start page lists and the agent API reads', () => {
	const CLOCK = { now: new Date('2026-11-06T12:00:00Z'), today: '2026-11-06' };
	const agentSlugs = (scope: Parameters<typeof listVisibleSources>[1]) =>
		listVisibleSources(db, scope)
			.markdown.split('\n')
			.map((line) => line.replace(/^- /, '').split(':')[0]);
	const listed = (userId?: number) =>
		load('', userId)
			.sources.rows.map((row) => row.slug)
			.sort();

	beforeEach(() => {
		addSourceWithPage('billing-docs', '# Billing\n\nInvoices.', true);
		addSourceWithPage('search-docs', '# Search\n\nQueries.', false);
		db.exec("INSERT INTO users (id, email) VALUES (1, 'writer@example.com')");
	});

	it('agree for a visitor, a user and a key limited to one internal source', () => {
		expect(listed()).toEqual(agentSlugs('public'));

		const everything = createApiKey(db, 'ci', 'all', null, 1);
		if ('error' in everything) throw new Error(everything.error);
		expect(listed(1)).toEqual(agentSlugs(scopeForKey(db, everything.key, CLOCK)!.scope));

		// The start page applies the rule in TypeScript, the agent API in SQL.
		const limited = createApiKey(db, 'search', ['search-docs'], null, 1);
		if ('error' in limited) throw new Error(limited.error);
		const scope = scopeForKey(db, limited.key, CLOCK)!.scope;
		const readable = sourceStats(db).filter((source) => inScope(scope, source));
		expect(readable.map((source) => source.slug)).toEqual(agentSlugs(scope));
		expect(agentSlugs(scope)).toEqual(['billing-docs', 'search-docs']);
	});

	it('names the documentation site of public sources only, also to a user', () => {
		const setDocs = db.prepare('UPDATE sources SET docs_url = ? WHERE slug = ?');
		setDocs.run('https://docs.example.com/billing/', 'billing-docs');
		setDocs.run('https://docs.internal.example/search/', 'search-docs');

		const docs = load('', 1).sources.rows.map(({ slug, docsUrl }) => ({ slug, docsUrl }));
		expect(docs).toContainEqual({
			slug: 'billing-docs',
			docsUrl: 'https://docs.example.com/billing/'
		});
		expect(docs).toContainEqual({ slug: 'search-docs', docsUrl: null });
	});
});

describe('start page', () => {
	it('names the MCP server in the connect example after INSTANCE_NAME, not the title, as one word', () => {
		expect(load('').mcpName).toBe('acme-agents');
	});

	it('lists the public sources to a visitor, and to a user also the internal ones', () => {
		addSourceWithPage('billing-docs', '# Invoices', true);
		const slugs = (userId?: number) => load('', userId).sources.rows.map((source) => source.slug);

		expect(slugs()).toEqual(['billing-docs']);
		expect(slugs(1)).toEqual(['billing-docs', 'platform-docs']);
	});

	it('tells about a source only the state of its content, and searches its description', () => {
		db.exec(`UPDATE sources SET error = 'git ls-remote failed', paused = 1,
			description = 'Login and tokens' WHERE slug = 'platform-docs'`);
		const [row] = load('?search=tokens', 1).sources.rows as Record<string, unknown>[];
		expect(row).toMatchObject({ slug: 'platform-docs', description: 'Login and tokens' });
		expect(Object.keys(row).sort()).toEqual(
			[
				'description',
				'docsUrl',
				'id',
				'lastSync',
				'name',
				'pages',
				'slug',
				'snippets',
				'tokens',
				'visibility'
			].sort()
		);
	});

	it('offers no query to a visitor while no source is public', () => {
		expect(load('?q=rollback').query).toBeUndefined();
	});

	describe('with a public source', () => {
		beforeEach(() => {
			addSourceWithPage('billing-docs', '# Invoices\n\nA rollback of an invoice.', true);
		});

		it('offers the form without a source selection', () => {
			expect(load('').query).toEqual({ values: { question: '', tokens: '3000' } });
		});

		it('answers a visitor from the public sources only, ignoring a source in the URL', () => {
			expect(load('?q=rollback').query?.answer?.raw).toContain('Source: billing-docs/index');
			expect(load('?q=rollback').query?.answer?.hits.map((hit) => hit.id)).toEqual([
				'billing-docs/index'
			]);
			expect(load('?q=rollback&source=platform-docs').query?.answer?.raw).not.toContain(
				'platform-docs'
			);
		});

		it('answers a user from the public and internal sources', () => {
			const answer = load('?q=rollback', 1).query?.answer?.raw;
			expect(answer).toContain('Source: platform-docs/index');
			expect(answer).toContain('Source: billing-docs/index');
		});

		it('searches only the first 500 characters of an over-long question', () => {
			// The first 500 characters hold no word of the page; "rollback" only follows them.
			const question = `${'kubernetes '.repeat(50)}rollback`;

			expect(load(`?q=${encodeURIComponent(question)}`).query?.answer).toMatchObject({
				hits: [],
				raw: expect.stringMatching(/^No results for/)
			});
			expect(load('?q=rollback').query?.answer?.raw).toContain('Source: billing-docs/index');
		});

		it('does not record a query that found nothing', () => {
			load('?q=kubernetes');

			expect(listMissedQueries(db)).toEqual([]);
		});
	});
});
