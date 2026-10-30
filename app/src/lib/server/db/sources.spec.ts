import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { DatabaseSync } from 'node:sqlite';
import { indexPages } from '../sync/index-pages';
import { openDatabase } from './schema';
import { replaceSourceIndex, type SourceIndex } from './sources';

let db: DatabaseSync;

function sourceIndex(commit: string, pages: Record<string, string>): SourceIndex {
	const prepared = Object.entries(pages).map(([file, markdown]) => ({
		file,
		markdown,
		navPosition: undefined,
		includeWarnings: []
	}));
	return { commit, ...indexPages({ pages: prepared, warnings: [], sourcePath: 'docs' }) };
}

function liveTitles(): string[] {
	return db
		.prepare('SELECT title FROM live_pages ORDER BY file')
		.all()
		.map((row) => row.title as string);
}

function count(table: string): number {
	return (db.prepare(`SELECT count(*) AS n FROM ${table}`).get() as { n: number }).n;
}

const OLD = { 'a.md': '# Old A\n\nSee [b](b.md).\n', 'b.md': '# Old B\n\nText.\n' };
const NEW = {
	'a.md': '# New A\n\nSee [b](b.md).\n',
	'b.md': '# New B\n\nText.\n',
	'c.md': '# New C\n\nText.\n'
};

beforeEach(() => {
	db = openDatabase(':memory:');
	db.exec(`INSERT INTO projects (id, slug) VALUES (1, 'platform');
		INSERT INTO sources (id, project_id, slug, git_url, branch, path)
		VALUES (1, 1, 'docs', 'https://git.example/docs.git', 'main', 'docs/');`);
	replaceSourceIndex(db, 1, sourceIndex('old', OLD));
});

describe('replaceSourceIndex', () => {
	it('writes the index in several short transactions', () => {
		const exec = vi.spyOn(db, 'exec');

		replaceSourceIndex(db, 1, sourceIndex('new', NEW), { snippetsPerBatch: 1 });

		const transactions = exec.mock.calls.filter(([sql]) => sql === 'BEGIN IMMEDIATE');
		// Three pages, one link, and the old pages deleted.
		expect(transactions.length).toBeGreaterThanOrEqual(5);
	});

	it('shows the new index once it is complete and leaves nothing of the old one', () => {
		replaceSourceIndex(db, 1, sourceIndex('new', NEW), { snippetsPerBatch: 1 });

		expect(liveTitles()).toEqual(['New A', 'New B', 'New C']);
		expect([count('pages'), count('snippets'), count('snippets_fts'), count('links')]).toEqual([
			3, 3, 3, 1
		]);
		expect(db.prepare('SELECT last_commit FROM sources').get()).toEqual({ last_commit: 'new' });
	});

	it('keeps the old index live when writing stops halfway, and clears the rest on the next sync', () => {
		const broken = sourceIndex('broken', NEW);
		broken.links.push({ file: 'missing.md', target: 'a', dead: false });

		expect(() => replaceSourceIndex(db, 1, broken, { snippetsPerBatch: 1 })).toThrow(
			'link from unknown page missing.md'
		);
		expect(liveTitles()).toEqual(['Old A', 'Old B']);
		expect(db.prepare('SELECT last_commit FROM sources').get()).toEqual({ last_commit: 'old' });

		replaceSourceIndex(db, 1, sourceIndex('new', NEW));
		expect(liveTitles()).toEqual(['New A', 'New B', 'New C']);
		expect(count('pages')).toBe(3);
	});
});
