import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { DatabaseSync } from 'node:sqlite';
import { openDatabase } from '#lib/server/db/schema.js';
import { replaceSourceIndex } from '#lib/server/db/sources.js';
import { chunkPage } from '#lib/server/parsing/chunk.js';
import { splitCode } from '#lib/server/parsing/markdown.js';
import { preprocessPage } from '#lib/server/parsing/preprocess.js';
import { querySources } from '#lib/server/agent/operations.js';
import * as page from './+page.server';

let db: DatabaseSync;

vi.mock('#lib/server/db/index.js', () => ({ database: () => db }));

function addSourceWithPage(slug: string, markdown: string) {
	const sourceId = Number(
		db
			.prepare(
				`INSERT INTO sources (slug, name, git_url, branch, path)
				VALUES (?, 'Docs', 'https://git.example/x.git', 'main', 'docs/')`
			)
			.run(slug).lastInsertRowid
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

interface QueryPage {
	sources: string[];
	values: { question: string; sources: string[]; tokens: string };
	error?: string;
	answer?: string;
}

function load(search: string): QueryPage {
	const url = new URL(`https://grimoire.example/manage/query${search}`);
	return page.load({ url } as never) as QueryPage;
}

beforeEach(() => {
	db = openDatabase(':memory:');
	addSourceWithPage('platform-docs', '# Rollback\n\nHow to roll back the platform.');
	addSourceWithPage('billing-docs', '# Invoices\n\nA rollback of an invoice.');
	addSourceWithPage('billing-archive', '# Old invoices\n\nA rollback in 2019.');
});

describe('query page', () => {
	it('searches nothing until the form is sent, and offers every source', () => {
		expect(load('')).toEqual({
			sources: ['billing-archive', 'billing-docs', 'platform-docs'],
			values: { question: '', sources: [], tokens: '3000' }
		});
	});

	it('answers with what query returns to an agent, across all sources', () => {
		const result = load('?q=rollback&tokens=3000');
		const expected = querySources(db, { query: 'rollback', tokens: 3000 }, 'all').markdown;
		expect(result.answer).toBe(expected);
		expect(result.answer).toContain('Source: platform-docs/index');
		expect(result.answer).toContain('Source: billing-docs/index');
		expect(result.answer).toContain('Source: billing-archive/index');
	});

	it('restricts the search to the chosen sources and keeps the values in the form', () => {
		const result = load('?q=rollback&source=billing-docs&source=billing-archive&tokens=500');
		expect(result.answer).toContain('Source: billing-docs/index');
		expect(result.answer).toContain('Source: billing-archive/index');
		expect(result.answer).not.toContain('platform-docs');
		expect(result.values).toEqual({
			question: 'rollback',
			sources: ['billing-docs', 'billing-archive'],
			tokens: '500'
		});
	});

	it('does not record a query without results: trying is not an agent asking', () => {
		expect(load('?q=nothing+matches&tokens=3000').answer).toContain('No results');
		expect(db.prepare('SELECT count(*) AS n FROM missed_queries').get()).toEqual({ n: 0 });
	});

	it('asks for a question instead of searching for blanks', () => {
		const result = load('?q=++&tokens=3000');
		expect(result.error).toBe('Enter a question.');
		expect(result).not.toHaveProperty('answer');
	});

	it('rejects a token budget that is not a positive whole number', () => {
		for (const tokens of ['0', '-5', '1.5', 'many']) {
			const result = load(`?q=rollback&tokens=${tokens}`);
			expect(result.error).toBe('The token budget must be a positive whole number.');
			expect(result).not.toHaveProperty('answer');
		}
	});
});
