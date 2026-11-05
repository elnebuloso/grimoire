import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { DatabaseSync } from 'node:sqlite';
import { openDatabase } from '#lib/server/db/schema.js';
import { replaceSourceIndex } from '#lib/server/db/sources.js';
import { chunkPage } from '#lib/server/parsing/chunk.js';
import { splitCode } from '#lib/server/parsing/markdown.js';
import { preprocessPage } from '#lib/server/parsing/preprocess.js';
import { listMissedQueries } from '#lib/server/missed-queries.js';
import type { QueryFormState } from '#lib/server/query-form.js';
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
		sources: { slug: string }[];
	};
}

beforeEach(() => {
	db = openDatabase(':memory:');
	addSourceWithPage('platform-docs', '# Rollback\n\nHow to roll back the platform.', false);
});

describe('start page', () => {
	it('names the MCP server in the connect example after INSTANCE_NAME, not the title, as one word', () => {
		expect(load('').mcpName).toBe('acme-agents');
	});

	it('lists the public sources to a visitor, and to a user also the internal ones', () => {
		addSourceWithPage('billing-docs', '# Invoices', true);
		const slugs = (userId?: number) => load('', userId).sources.map((source) => source.slug);

		expect(slugs()).toEqual(['billing-docs']);
		expect(slugs(1)).toEqual(['billing-docs', 'platform-docs']);
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
			expect(load('?q=rollback').query?.answer).toContain('Source: billing-docs/index');
			expect(load('?q=rollback').query?.answer).not.toContain('platform-docs');
			expect(load('?q=rollback&source=platform-docs').query?.answer).not.toContain('platform-docs');
		});

		it('answers a user from the public and internal sources', () => {
			const answer = load('?q=rollback', 1).query?.answer;
			expect(answer).toContain('Source: platform-docs/index');
			expect(answer).toContain('Source: billing-docs/index');
		});

		it('searches only the first 500 characters of an over-long question', () => {
			// The first 500 characters hold no word of the page; "rollback" only follows them.
			const question = `${'kubernetes '.repeat(50)}rollback`;

			expect(load(`?q=${encodeURIComponent(question)}`).query?.answer).toMatch(/^No results for/);
			expect(load('?q=rollback').query?.answer).toContain('Source: billing-docs/index');
		});

		it('does not record a query that found nothing', () => {
			load('?q=kubernetes');

			expect(listMissedQueries(db)).toEqual([]);
		});
	});
});
