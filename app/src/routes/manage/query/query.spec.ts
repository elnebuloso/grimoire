import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { DatabaseSync } from 'node:sqlite';
import { openDatabase } from '#lib/server/db/schema.js';
import { replaceSourceIndex } from '#lib/server/db/sources.js';
import { chunkPage } from '#lib/server/parsing/chunk.js';
import { splitCode } from '#lib/server/parsing/markdown.js';
import { preprocessPage } from '#lib/server/parsing/preprocess.js';
import { queryProjects } from '#lib/server/agent/operations.js';
import * as page from './+page.server';

let db: DatabaseSync;

vi.mock('#lib/server/db/index.js', () => ({ database: () => db }));

function addProjectWithPage(slug: string, markdown: string) {
	const projectId = db.prepare('INSERT INTO projects (slug) VALUES (?)').run(slug).lastInsertRowid;
	const sourceId = Number(
		db
			.prepare(
				`INSERT INTO sources (project_id, slug, git_url, branch, path)
				VALUES (?, 'docs', 'https://git.example/x.git', 'main', 'docs/')`
			)
			.run(projectId).lastInsertRowid
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
	projects: string[];
	values: { question: string; project: string; tokens: string };
	error?: string;
	answer?: string;
}

function load(search: string): QueryPage {
	const url = new URL(`https://grimoire.example/manage/query${search}`);
	return page.load({ url } as never) as QueryPage;
}

beforeEach(() => {
	db = openDatabase(':memory:');
	addProjectWithPage('platform', '# Rollback\n\nHow to roll back the platform.');
	addProjectWithPage('billing', '# Invoices\n\nA rollback of an invoice.');
});

describe('query page', () => {
	it('searches nothing until the form is sent, and offers every project', () => {
		expect(load('')).toEqual({
			projects: ['billing', 'platform'],
			values: { question: '', project: '', tokens: '3000' }
		});
	});

	it('answers with what query returns to an agent, across all projects', () => {
		const result = load('?q=rollback&project=&tokens=3000');
		const expected = queryProjects(db, { query: 'rollback', tokens: 3000 }, 'all').markdown;
		expect(result.answer).toBe(expected);
		expect(result.answer).toContain('Source: platform/docs/index');
		expect(result.answer).toContain('Source: billing/docs/index');
	});

	it('restricts the search to the chosen project and keeps the values in the form', () => {
		const result = load('?q=rollback&project=billing&tokens=50');
		expect(result.answer).toContain('Source: billing/docs/index');
		expect(result.answer).not.toContain('platform/docs');
		expect(result.values).toEqual({ question: 'rollback', project: 'billing', tokens: '50' });
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
