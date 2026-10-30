import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { DatabaseSync } from 'node:sqlite';
import { Worker } from 'node:worker_threads';
import {
	clearSyncError,
	recordCheck,
	recordSyncError,
	recordSyncRun,
	sourceForSync
} from '../db/sources';
import { decryptToken } from '../token-encryption';
import { headCommit, redact, remoteCommit, sparseClone, type GitRemote } from './git';
import type { IndexJob } from './index-worker';
import type { SyncLanes } from './queue';

const IMMEDIATELY: SyncLanes = { check: (work) => work(), sync: (work) => work() };

export interface SyncOptions {
	/** Value of `TOKEN_ENCRYPTION_KEY`. */
	key: Buffer;
	/** Sync even when the branch has not moved, e.g. after the source settings changed. */
	force?: boolean;
	/** Directory for the temporary clone; defaults to the system temp directory. */
	workDirectory?: string;
	/** Where the check and the sync stage run; by default both start right away. */
	lanes?: SyncLanes;
	/** Value of `INCLUDE_URL_ALLOW`: the origins URL includes may be fetched from. */
	allowedIncludeOrigins?: string[];
	/** How long indexing may take before the sync fails; defaults to `INDEXING_DEADLINE_MS`. */
	indexingDeadlineMs?: number;
}

// A large real source takes about a minute. Without a deadline, content that keeps the worker
// busy would hold the single sync slot, and with it every other source, until a restart.
const INDEXING_DEADLINE_MS = 10 * 60_000;

export type SyncResult =
	| { status: 'unchanged'; commit: string }
	| { status: 'synced'; commit: string; pages: number; warnings: string[] }
	| { status: 'failed'; error: string };

/**
 * Brings one source into the index: checks the branch with `ls-remote`, and when it moved, clones
 * the source path into a temporary directory, indexes it and replaces the source's pages in one
 * transaction. On failure the previous index stays active and the error is stored on the source.
 * Every run goes into the source's sync history.
 */
export async function syncSource(
	db: DatabaseSync,
	sourceId: number,
	options: SyncOptions
): Promise<SyncResult> {
	const startedAt = new Date();
	const result = await checkAndSync(db, sourceId, options);
	recordSyncRun(db, sourceId, {
		startedAt,
		finishedAt: new Date(),
		outcome: result.status,
		commit: result.status === 'failed' ? null : result.commit,
		error: result.status === 'failed' ? result.error : null
	});
	return result;
}

async function checkAndSync(
	db: DatabaseSync,
	sourceId: number,
	options: SyncOptions
): Promise<SyncResult> {
	const source = sourceForSync(db, sourceId);
	const lanes = options.lanes ?? IMMEDIATELY;
	let remote: GitRemote = { url: source.gitUrl, username: source.username };
	// Set again when the check really starts; also recorded when it never got that far, so a
	// broken source waits for its next scheduled run instead of being retried on every tick.
	let checkedAt = new Date();

	try {
		const token = source.encryptedToken && decryptToken(source.encryptedToken, options.key);
		remote = { ...remote, token };

		const latest = await lanes.check(() => {
			checkedAt = new Date();
			// Recorded now, not only at the end: a process that dies in the sync stage (out of memory,
			// say) would otherwise find the source due again on restart and die again, every start.
			recordCheck(db, sourceId, checkedAt);
			return remoteCommit(remote, source.branch);
		});
		if (latest === source.lastCommit && !options.force) {
			clearSyncError(db, sourceId);
			return { status: 'unchanged', commit: latest };
		}

		return await lanes.sync(async () => {
			const checkout = await mkdtemp(join(options.workDirectory ?? tmpdir(), 'grimoire-sync-'));
			try {
				await sparseClone(remote, source.branch, source.path, checkout);
				const commit = await headCommit(checkout);
				const indexed = await indexInWorker(
					{
						checkout,
						source: { path: source.path, exclusions: source.exclusions },
						remote,
						allowedIncludeOrigins: options.allowedIncludeOrigins ?? [],
						databasePath: databasePath(db),
						sourceId,
						commit
					},
					options.indexingDeadlineMs ?? INDEXING_DEADLINE_MS
				);
				return { status: 'synced' as const, commit, ...indexed };
			} finally {
				await rm(checkout, { recursive: true, force: true });
			}
		});
	} catch (error) {
		const message = redact((error as Error).message, remote);
		recordSyncError(db, sourceId, message);
		return { status: 'failed', error: message };
	} finally {
		recordCheck(db, sourceId, checkedAt);
	}
}

/**
 * Reads the checkout, resolves includes, turns the pages into snippets and writes them, in a
 * worker thread: on a large source that is a minute of Markdown processing, which on the server's
 * thread would hold up every request, and a docs branch that exhausts memory there would end the
 * server instead of the sync.
 */
function indexInWorker(
	job: IndexJob,
	deadlineMs: number
): Promise<{ pages: number; warnings: string[] }> {
	// The worker runs from source; `#lib` points at it from the dev server, tests and the build.
	const worker = new Worker(new URL(import.meta.resolve('#lib/server/sync/index-worker.ts')), {
		workerData: job
	});
	return new Promise((resolve, reject) => {
		// Terminating rolls back the worker's open transaction; the rows it already committed belong
		// to a generation that never went live and go with the next successful sync.
		const deadline = setTimeout(() => {
			reject(new Error(`indexing took longer than ${formatDuration(deadlineMs)}`));
			void worker.terminate();
		}, deadlineMs);
		worker.once('message', resolve);
		worker.once('error', reject);
		worker.once('exit', (code) => {
			clearTimeout(deadline);
			if (code !== 0) reject(new Error(`indexing stopped with exit code ${code}`));
		});
	});
}

function formatDuration(ms: number): string {
	return ms >= 60_000 ? `${ms / 60_000} minutes` : `${ms / 1000} seconds`;
}

function databasePath(db: DatabaseSync): string {
	const path = db.location();
	if (!path) throw new Error('a source can only be indexed into a database file');
	return path;
}
