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
vi.mock('$app/env/private', () => ({ TZ: 'UTC', BASE_URL: '', INSTANCE_NAME: 'Acme Docs' }));

function addSourceWithPage(slug: string, markdown: string, isPublic: boolean, privateTo?: number) {
	const visibility = isPublic ? 'public' : privateTo ? 'private' : 'internal';
	const sourceId = Number(
		db
			.prepare(
				`INSERT INTO sources (slug, name, git_url, branch, path, visibility, owner_id)
				VALUES (?, 'Docs', 'https://git.internal.example/x.git', 'main', 'docs/', ?, ?)`
			)
			.run(slug, visibility, privateTo ?? null).lastInsertRowid
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
	it('names the MCP server in the connect example after the instance, as one word', () => {
		expect(load('').mcpName).toBe('acme-docs');
	});

	it('lists the public sources to a visitor, and to a user also internal and their own private ones', () => {
		const insertUser = db.prepare("INSERT INTO users (email, password_hash) VALUES (?, 'hash')");
		const writer = Number(insertUser.run('writer@example.com').lastInsertRowid);
		const other = Number(insertUser.run('ops@example.com').lastInsertRowid);
		addSourceWithPage('billing-docs', '# Invoices', true);
		addSourceWithPage('release-drafts', '# Drafts', false, writer);
		const slugs = (userId?: number) => load('', userId).sources.map((source) => source.slug);

		expect(slugs()).toEqual(['billing-docs']);
		expect(slugs(writer)).toEqual(['billing-docs', 'platform-docs', 'release-drafts']);
		expect(slugs(other)).toEqual(['billing-docs', 'platform-docs']);
	});

	it('offers no query while no source is public', () => {
		expect(load('?q=rollback').query).toBeUndefined();
	});

	describe('with a public source', () => {
		beforeEach(() => {
			addSourceWithPage('billing-docs', '# Invoices\n\nA rollback of an invoice.', true);
		});

		it('offers only the public sources to tick', () => {
			expect(load('').query).toEqual({
				sources: ['billing-docs'],
				values: { question: '', sources: [], tokens: '3000' }
			});
		});

		it('answers from the public sources only', () => {
			const answer = load('?q=rollback').query?.answer;

			expect(answer).toContain('Source: billing-docs/index');
			expect(answer).not.toContain('platform-docs');
		});

		it('treats a private source named in the form like an unknown one', () => {
			expect(load('?q=rollback&source=platform-docs').query?.answer).toBe(
				'Source "platform-docs" not found. See `sources`.'
			);
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
