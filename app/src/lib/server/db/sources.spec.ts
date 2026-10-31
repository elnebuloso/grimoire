import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { DatabaseSync } from 'node:sqlite';
import { indexPages } from '../sync/index-pages';
import { openDatabase } from './schema';
import {
	recordSyncError,
	recordSyncRun,
	replaceSourceIndex,
	type SourceIndex,
	type SyncRun
} from './sources';

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
	db.exec(`INSERT INTO sources (id, slug, name, git_url, branch, path)
		VALUES (1, 'docs', 'Docs', 'https://git.example/docs.git', 'main', 'docs/');`);
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

	it('deletes the old index in transactions of at most one batch of snippets', () => {
		const sections = (page: string) =>
			Array.from({ length: 5 }, (_, i) => `## ${page} ${i}\n\n${'word '.repeat(60)}`).join('\n\n');
		replaceSourceIndex(
			db,
			1,
			sourceIndex('large', { 'a.md': sections('A'), 'b.md': sections('B') })
		);
		expect(count('snippets')).toBe(10);
		const snippetsAtCommit: number[] = [];
		const exec = db.exec.bind(db);
		vi.spyOn(db, 'exec').mockImplementation((sql) => {
			if (sql === 'COMMIT') snippetsAtCommit.push(count('snippets'));
			exec(sql);
		});

		replaceSourceIndex(db, 1, sourceIndex('small', { 'c.md': '# C\n\nText.\n' }), {
			snippetsPerBatch: 3
		});

		const deletedPerCommit = snippetsAtCommit
			.map((snippets, i) => (snippetsAtCommit[i - 1] ?? 10) - snippets)
			.filter((deleted) => deleted > 0);
		expect(deletedPerCommit).toEqual([3, 3, 3, 1]);
		expect(liveTitles()).toEqual(['C']);
		expect([count('pages'), count('snippets'), count('snippets_fts'), count('links')]).toEqual([
			1, 1, 1, 0
		]);
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

describe('sync state of a source', () => {
	const state = (id = 1) =>
		db
			.prepare('SELECT last_commit, last_synced_at, error, failed_commit FROM sources WHERE id = ?')
			.get(id);

	it('sets last_synced_at only when an index is swapped in, never on a failure', () => {
		db.exec(`INSERT INTO sources (id, slug, name, git_url, branch, path)
			VALUES (2, 'new', 'New', 'https://git.example/new.git', 'main', 'docs/');`);
		recordSyncError(db, 2, 'git ls-remote failed');
		expect(state(2)).toMatchObject({ last_synced_at: null, error: 'git ls-remote failed' });

		const synced = state().last_synced_at;
		expect(synced).not.toBeNull();
		recordSyncError(db, 1, 'indexing took longer than 10 minutes', 'bad');
		expect(state()).toMatchObject({ last_synced_at: synced, failed_commit: 'bad' });
	});

	it('clears the error and the failed commit when a new index is swapped in', () => {
		recordSyncError(db, 1, 'indexing took longer than 10 minutes', 'bad');
		replaceSourceIndex(db, 1, sourceIndex('new', NEW));
		expect(state()).toMatchObject({ last_commit: 'new', error: null, failed_commit: null });
	});
});

describe('recordSyncRun', () => {
	const at = (minute: number) => new Date(Date.UTC(2026, 9, 30, 12, minute));

	function record(run: SyncRun, minute: number, sourceId = 1) {
		const startedAt = at(minute);
		const finishedAt = new Date(startedAt.getTime() + 30_000);
		recordSyncRun(db, sourceId, { ...run, startedAt, finishedAt });
	}

	function history() {
		return db
			.prepare(
				'SELECT outcome, commit_hash, error, runs, started_at, finished_at FROM sync_runs ORDER BY id'
			)
			.all();
	}

	const synced = (commit: string): SyncRun => ({ outcome: 'synced', commit, error: null });
	const unchanged = (commit: string): SyncRun => ({ outcome: 'unchanged', commit, error: null });
	const failed = (error: string): SyncRun => ({ outcome: 'failed', commit: null, error });

	it('counts repeats of the latest entry in it, keeping when the first started', () => {
		record(synced('a'), 0);
		record(unchanged('a'), 5);
		record(unchanged('a'), 10);
		record(failed('unreachable'), 15);
		record(failed('unreachable'), 20);
		record(failed('denied'), 25);
		record(unchanged('a'), 30);

		expect(history()).toEqual([
			expect.objectContaining({ outcome: 'synced', commit_hash: 'a', runs: 1 }),
			{
				outcome: 'unchanged',
				commit_hash: 'a',
				error: null,
				runs: 2,
				started_at: '2026-10-30T12:05:00.000Z',
				finished_at: '2026-10-30T12:10:30.000Z'
			},
			expect.objectContaining({ outcome: 'failed', error: 'unreachable', runs: 2 }),
			expect.objectContaining({ outcome: 'failed', error: 'denied', runs: 1 }),
			expect.objectContaining({ outcome: 'unchanged', commit_hash: 'a', runs: 1 })
		]);
	});

	it('keeps every sync apart, even of the same commit', () => {
		record(synced('a'), 0);
		record(synced('a'), 5);

		expect(history()).toHaveLength(2);
	});

	it('keeps the newest 100 entries of a source', () => {
		for (let minute = 0; minute < 101; minute++) record(synced(`c${minute}`), minute);

		expect(count('sync_runs')).toBe(100);
		expect(history()[0]).toMatchObject({ commit_hash: 'c1' });
	});

	it('is deleted with its source, and skips a source deleted while it synced', () => {
		record(synced('a'), 0);
		db.exec('DELETE FROM sources WHERE id = 1');
		expect(count('sync_runs')).toBe(0);

		record(synced('b'), 5);
		expect(count('sync_runs')).toBe(0);
	});
});
