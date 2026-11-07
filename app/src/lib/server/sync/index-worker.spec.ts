import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { fork } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { DatabaseSync } from 'node:sqlite';
import { openDatabase } from '../db/schema';
import type { IndexJob } from './index-worker';

// A real indexing process, started by Node from source as the server starts it.
vi.setConfig({ testTimeout: 30_000 });

const WORKER = join(import.meta.dirname, 'index-worker.ts');

let root: string;
let db: DatabaseSync;

beforeEach(() => {
	root = mkdtempSync(join(tmpdir(), 'grimoire-worker-'));
	mkdirSync(join(root, 'checkout/docs'), { recursive: true });
	writeFileSync(join(root, 'checkout/docs/index.md'), '# Start\n\nRollback steps.\n');
	db = openDatabase(join(root, 'grimoire.db'));
	db.exec(`INSERT INTO sources (id, slug, name, git_url, branch, path)
		VALUES (1, 'platform', 'Platform', 'https://git.example.com/platform.git', 'main', 'docs/')`);
});

afterEach(() => {
	db.close();
	rmSync(root, { recursive: true, force: true });
});

/** Runs the indexing process on the checkout for a server with `serverPid`; its exit code. */
function runWorker(serverPid: number): Promise<number | null> {
	const job: IndexJob = {
		checkout: join(root, 'checkout'),
		source: { path: 'docs/', exclusions: [] },
		remote: {
			url: 'https://git.example.com/platform.git',
			policy: { allowedHosts: [], proxy: false }
		},
		allowedIncludeOrigins: [],
		databasePath: join(root, 'grimoire.db'),
		sourceId: 1,
		commit: 'c1',
		serverPid
	};
	const child = fork(WORKER, { execArgv: [] });
	child.on('message', () => child.disconnect());
	child.send(job);
	return new Promise((resolve) => child.once('exit', (code) => resolve(code)));
}

const lastCommit = () =>
	(
		db.prepare('SELECT last_commit FROM sources WHERE id = 1').get() as {
			last_commit: string | null;
		}
	).last_commit;

describe('the indexing process', () => {
	it('writes the index for the server that started it', async () => {
		await runWorker(process.pid);

		expect(lastCommit()).toBe('c1');
	});

	it('writes nothing once its server is gone, its parent being another process then', async () => {
		// The server's process ID differs from the parent's, as after the server died of a signal.
		expect(await runWorker(process.pid + 1_000_000)).toBe(1);

		expect(lastCommit()).toBeNull();
		expect(db.prepare('SELECT count(*) AS pages FROM pages').get()).toEqual({ pages: 0 });
	});
});
