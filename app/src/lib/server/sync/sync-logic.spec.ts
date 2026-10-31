import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { fork } from 'node:child_process';
import { mkdtempSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { DatabaseSync } from 'node:sqlite';
import { saveSource, type SourceForm } from '../admin/sources';
import { openDatabase } from '../db/schema';
import { saveSettings } from '../settings';
import { listSchedules, replaceSourceIndex } from '../db/sources';
import { encryptToken } from '../token-encryption';
import { headCommit, remoteCommit } from './git';
import { indexPages } from './index-pages';
import type { IndexJob, IndexOutcome } from './index-worker';
import { createSyncQueue, type SyncLanes } from './queue';
import { isDue } from './schedule';
import { syncSource } from './sync';

// The decisions of a sync around Git and the indexing process, with both replaced; sync.spec.ts
// runs them for real.
vi.mock('./git', async (importOriginal) => ({
	...(await importOriginal<typeof import('./git')>()),
	remoteCommit: vi.fn(),
	sparseClone: vi.fn(async () => {}),
	headCommit: vi.fn()
}));

const indexing = vi.hoisted(() => ({
	/** What the stand-in indexing process does with a job; it answers with the result. */
	run: (() => ({ pages: 0, warnings: [] })) as (job: IndexJob) => IndexOutcome
}));

vi.mock('node:child_process', async (importOriginal) => {
	const { EventEmitter } = await import('node:events');
	return {
		...(await importOriginal<typeof import('node:child_process')>()),
		fork: vi.fn(() => {
			const child = Object.assign(new EventEmitter(), {
				send(job: IndexJob) {
					setImmediate(() => {
						child.emit('message', indexing.run(job));
						child.emit('close', 0, null);
					});
				},
				kill() {}
			});
			return child;
		})
	};
});

const key = Buffer.alloc(32, 7);

let root: string;
let work: string;
let db: DatabaseSync;
let source: number;

/** The branch is at `commit` on the remote, and a clone checks it out. */
function branchAt(commit: string) {
	vi.mocked(remoteCommit).mockResolvedValue(commit);
	vi.mocked(headCommit).mockResolvedValue(commit);
}

function rows(sql: string, ...values: (string | number)[]) {
	return db
		.prepare(sql)
		.all(...values)
		.map((row) => ({ ...row }));
}

function addSource(token?: string) {
	return Number(
		db
			.prepare(
				`INSERT INTO sources (slug, name, git_url, branch, path, username, encrypted_token)
				VALUES (?, 'Docs', 'https://git.example.com/auth.git', 'main', 'docs/', 'deploy', ?)`
			)
			.run(`auth-${Math.random().toString(36).slice(2)}`, token ? encryptToken(token, key) : null)
			.lastInsertRowid
	);
}

/** Writes one page for the job, as the indexing process would. */
function indexOnePage(job: IndexJob): IndexOutcome {
	const index = indexPages({
		pages: [{ file: 'index.md', markdown: '# Home\n\nText.\n', includeWarnings: [] }],
		warnings: [],
		sourcePath: 'docs'
	});
	replaceSourceIndex(db, job.sourceId, { commit: job.commit, ...index });
	return { pages: index.pages.length, warnings: [] };
}

const sync = (id = source, options: { force?: boolean; lanes?: SyncLanes } = {}) =>
	syncSource(db, id, { key, workDirectory: work, ...options });

beforeEach(() => {
	root = mkdtempSync(join(tmpdir(), 'grimoire-sync-logic-'));
	work = mkdtempSync(join(root, 'work-'));
	// A file, not memory: a sync hands the indexing process the path of the database.
	db = openDatabase(join(root, 'grimoire.db'));
	source = addSource();
	vi.clearAllMocks();
	branchAt('c1');
	indexing.run = indexOnePage;
});

afterEach(() => {
	db.close();
	rmSync(root, { recursive: true, force: true });
});

describe('syncSource', () => {
	it('keeps the last good index and stores the error when the check fails', async () => {
		await sync();
		vi.mocked(remoteCommit).mockRejectedValue(new Error('git ls-remote failed: not found'));

		expect(await sync()).toEqual({ status: 'failed', error: 'git ls-remote failed: not found' });
		expect(rows('SELECT count(*) AS n FROM live_pages')).toEqual([{ n: 1 }]);
		expect(rows('SELECT error FROM sources WHERE id = ?', source)).toEqual([
			{ error: 'git ls-remote failed: not found' }
		]);
		expect(readdirSync(work)).toEqual([]);
	});

	it('records when every check started, whether it synced, found nothing new or failed', async () => {
		vi.useFakeTimers({ toFake: ['Date'] });
		let checkStartedAt = new Date('2026-10-30T08:00:00.000Z');
		// The clock is set where a check starts; the sync stage runs an hour later.
		const lanes: SyncLanes = {
			check: (run) => {
				vi.setSystemTime(checkStartedAt);
				return run();
			},
			sync: (run) => {
				vi.setSystemTime(checkStartedAt.getTime() + 3_600_000);
				return run();
			}
		};
		const checkedAt = () =>
			rows('SELECT last_checked_at FROM sources WHERE id = ?', source)[0].last_checked_at;

		try {
			expect(await sync(source, { lanes })).toMatchObject({ status: 'synced' });
			expect(checkedAt()).toBe('2026-10-30T08:00:00.000Z');

			checkStartedAt = new Date('2026-10-30T09:00:00.000Z');
			expect(await sync(source, { lanes })).toMatchObject({ status: 'unchanged' });
			expect(checkedAt()).toBe('2026-10-30T09:00:00.000Z');

			vi.mocked(remoteCommit).mockRejectedValue(new Error('git ls-remote failed'));
			checkStartedAt = new Date('2026-10-30T10:00:00.000Z');
			expect(await sync(source, { lanes })).toMatchObject({ status: 'failed' });
			expect(checkedAt()).toBe('2026-10-30T10:00:00.000Z');
		} finally {
			vi.useRealTimers();
		}
	});

	it('records the check before the sync stage, so a process dying in it is not due again on restart', async () => {
		let syncStageReached!: () => void;
		const reached = new Promise<void>((resolve) => (syncStageReached = resolve));
		// The sync stage never finishes, as when the process dies in it.
		const lanes: SyncLanes = {
			check: (run) => run(),
			sync: () => {
				syncStageReached();
				return new Promise(() => {});
			}
		};

		void sync(source, { lanes });
		await reached;

		const [schedule] = listSchedules(db);
		expect(schedule.lastCheckedAt).not.toBeNull();
		expect(isDue('0 * * * *', schedule.lastCheckedAt, schedule.lastCheckedAt!, 'UTC')).toBe(false);
	});

	it('records every run in the history of the source', async () => {
		await sync();
		await sync();
		await sync();
		vi.mocked(remoteCommit).mockRejectedValue(new Error('git ls-remote failed'));
		await sync();

		expect(
			rows(
				'SELECT outcome, commit_hash, error, runs FROM sync_runs WHERE source_id = ? ORDER BY id',
				source
			)
		).toEqual([
			{ outcome: 'synced', commit_hash: 'c1', error: null, runs: 1 },
			{ outcome: 'unchanged', commit_hash: 'c1', error: null, runs: 2 },
			{ outcome: 'failed', commit_hash: null, error: 'git ls-remote failed', runs: 1 }
		]);
	});

	it('never stores the access token, not even in an error', async () => {
		const token = 'glpat-very-secret-token';
		const withToken = addSource(token);
		const basic = Buffer.from(`deploy:${token}`).toString('base64');
		vi.mocked(remoteCommit).mockRejectedValue(
			new Error(`git ls-remote failed: https://deploy:${token}@git.example.com (Basic ${basic})`)
		);

		expect(await sync(withToken)).toMatchObject({ status: 'failed' });
		const [state] = rows('SELECT error, encrypted_token FROM sources WHERE id = ?', withToken);
		expect(state.error).toMatch(/^git ls-remote failed/);
		expect(state.error).not.toContain(token);
		expect(state.error).not.toContain(basic);
		expect(state.encrypted_token).not.toContain(token);
	});

	it('reports a wrong encryption key as an error of the source', async () => {
		const withToken = addSource('secret');

		expect(
			await syncSource(db, withToken, { key: Buffer.alloc(32, 9), workDirectory: work })
		).toMatchObject({ status: 'failed', error: expect.stringMatching(/ENCRYPTION_KEY differs/) });
		expect(remoteCommit).not.toHaveBeenCalled();
	});

	it('does not index a commit again whose indexing failed, unless forced', async () => {
		indexing.run = () => ({ error: 'indexing took longer than 10 minutes' });
		expect(await sync()).toEqual({
			status: 'failed',
			error: 'indexing took longer than 10 minutes',
			commit: 'c1'
		});

		indexing.run = indexOnePage;
		expect(await sync()).toEqual({
			status: 'failed',
			error: 'indexing took longer than 10 minutes',
			commit: 'c1'
		});
		expect(fork).toHaveBeenCalledTimes(1);
		expect(
			rows('SELECT outcome, commit_hash, runs FROM sync_runs WHERE source_id = ?', source)
		).toEqual([{ outcome: 'failed', commit_hash: 'c1', runs: 2 }]);

		expect(await sync(source, { force: true })).toMatchObject({ status: 'synced', pages: 1 });
		expect(fork).toHaveBeenCalledTimes(2);
	});

	it('indexes the next commit after one whose indexing failed', async () => {
		indexing.run = () => ({ error: 'indexing took longer than 10 minutes' });
		await sync();
		indexing.run = indexOnePage;
		branchAt('c2');

		expect(await sync()).toMatchObject({ status: 'synced', commit: 'c2', pages: 1 });
		expect(rows('SELECT error, failed_commit FROM sources WHERE id = ?', source)).toEqual([
			{ error: null, failed_commit: null }
		]);
	});

	describe('settings saved while the source does not sync on its own', () => {
		// The form as the source page sends it for the source `addSource` created.
		const save = (changes: Partial<SourceForm>) => {
			const result = saveSource(db, key, source, {
				name: 'Docs',
				description: '',
				gitUrl: 'https://git.example.com/auth.git',
				docsUrl: '',
				branch: 'main',
				path: 'docs/',
				exclusions: '',
				schedule: '',
				paused: false,
				public: false,
				username: 'deploy',
				token: '',
				removeToken: false,
				...changes
			});
			if ('error' in result) throw new Error(result.error);
		};

		// Stored as the form stores it, path normalised, before the first sync.
		beforeEach(() => save({}));

		it('are indexed by the next sync, without a new commit', async () => {
			await sync();
			save({ paused: true, path: 'guides/' });
			save({ paused: false, path: 'guides/' });

			expect(await sync()).toMatchObject({ status: 'synced', commit: 'c1' });
			expect(fork).toHaveBeenCalledTimes(2);
		});

		it('are indexed by the next sync once all syncs are resumed', async () => {
			await sync();
			saveSettings(db, { syncsPaused: true });
			save({ branch: 'release' });
			saveSettings(db, { syncsPaused: false });

			expect(await sync()).toMatchObject({ status: 'synced', commit: 'c1' });
		});

		it('retry a commit whose indexing failed with the old settings', async () => {
			indexing.run = () => ({ error: 'indexing took longer than 10 minutes' });
			await sync();
			indexing.run = indexOnePage;
			save({ paused: true, exclusions: 'docs/huge/**' });
			save({ exclusions: 'docs/huge/**' });

			expect(await sync()).toMatchObject({ status: 'synced', commit: 'c1' });
		});

		it('leave the index alone when nothing the index depends on changed', async () => {
			await sync();
			save({ paused: true, name: 'Auth docs', description: 'How auth works' });
			save({ name: 'Auth docs', description: 'How auth works' });

			expect(await sync()).toMatchObject({ status: 'unchanged', commit: 'c1' });
		});
	});
});

describe('deleting a source while it is queued', () => {
	it('fails its sync and keeps the queue working for the others', async () => {
		const other = addSource();
		const queue = createSyncQueue((id, force, lanes) => sync(id, { force, lanes }));
		db.prepare('DELETE FROM sources WHERE id = ?').run(source);

		const deleted = queue.request(source);
		const kept = queue.request(other);

		await expect(deleted).rejects.toThrow(`source ${source} does not exist`);
		expect(await kept).toMatchObject({ status: 'synced' });
		expect(queue.isPending(source)).toBe(false);
	});
});
