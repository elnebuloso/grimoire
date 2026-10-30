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
vi.mock('$app/env/private', () => ({ TZ: 'UTC', BASE_URL: '' }));

function addSourceWithPage(slug: string, markdown: string, isPublic: boolean) {
	const sourceId = Number(
		db
			.prepare(
				`INSERT INTO sources (slug, name, git_url, branch, path, public)
				VALUES (?, 'Docs', 'https://git.internal.example/x.git', 'main', 'docs/', ?)`
			)
			.run(slug, isPublic ? 1 : 0).lastInsertRowid
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

function load(search: string) {
	const url = new URL(`https://grimoire.example/${search}`);
	return page.load({ url } as never) as { query?: QueryFormState };
}

beforeEach(() => {
	db = openDatabase(':memory:');
	addSourceWithPage('platform-docs', '# Rollback\n\nHow to roll back the platform.', false);
});

describe('start page', () => {
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

		it('does not record a query that found nothing', () => {
			load('?q=kubernetes');

			expect(listMissedQueries(db)).toEqual([]);
		});
	});
});
