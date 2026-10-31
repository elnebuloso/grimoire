import { fork } from 'node:child_process';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { DatabaseSync } from 'node:sqlite';
import { fileURLToPath } from 'node:url';
import {
	clearSyncError,
	recordCheck,
	recordSyncError,
	recordSyncRun,
	sourceForSync
} from '../db/sources';
import { decryptToken } from '../token-encryption';
import { headCommit, redact, remoteCommit, sparseClone, type GitRemote } from './git';
import type { IndexJob, IndexOutcome } from './index-worker';
import type { SyncLanes } from './queue';

const IMMEDIATELY: SyncLanes = { check: (work) => work(), sync: (work) => work() };

export interface SyncOptions {
	/** The key of the stored access tokens, derived from `ENCRYPTION_KEY`. */
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
	/** Heap limit of the indexing process in MiB; by default Node sizes it to the machine. */
	indexingHeapMb?: number;
}

// A large real source takes about a minute. Without a deadline, content that keeps the indexing
// busy would hold the single sync slot, and with it every other source, until a restart.
const INDEXING_DEADLINE_MS = 10 * 60_000;

export type SyncResult =
	| { status: 'unchanged'; commit: string }
	| { status: 'synced'; commit: string; pages: number; warnings: string[] }
	/** `commit` is the one that failed to index; undefined when the sync failed before one was known. */
	| { status: 'failed'; error: string; commit?: string };

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
		commit: result.commit ?? null,
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
	let indexingCommit: string | undefined;

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
		// Indexing the same commit again fails the same way, and a run up to the deadline would
		// otherwise hold the single sync slot in every interval; a new commit or a forced run retries.
		if (latest === source.failedCommit && source.error && !options.force) {
			return { status: 'failed', error: source.error, commit: latest };
		}

		return await lanes.sync(async () => {
			const checkout = await mkdtemp(join(options.workDirectory ?? tmpdir(), 'grimoire-sync-'));
			try {
				await sparseClone(remote, source.branch, source.path, checkout);
				const commit = await headCommit(checkout);
				indexingCommit = latest;
				const indexed = await indexInProcess(
					{
						checkout,
						source: { path: source.path, exclusions: source.exclusions },
						remote,
						allowedIncludeOrigins: options.allowedIncludeOrigins ?? [],
						databasePath: databasePath(db),
						sourceId,
						commit
					},
					options.indexingDeadlineMs ?? INDEXING_DEADLINE_MS,
					options.indexingHeapMb
				);
				return { status: 'synced' as const, commit, ...indexed };
			} finally {
				await rm(checkout, { recursive: true, force: true });
			}
		});
	} catch (error) {
		const message = redact((error as Error).message, remote);
		recordSyncError(db, sourceId, message, indexingCommit);
		return { status: 'failed', error: message, commit: indexingCommit };
	} finally {
		recordCheck(db, sourceId, checkedAt);
	}
}

/**
 * Reads the checkout, resolves includes, turns the pages into snippets and writes them, in a
 * child process: on a large source that is a minute of Markdown processing, which in the server
 * would hold up every request. A process rather than a worker thread because of memory: a docs
 * branch that exhausts it gets this process killed, by V8 or by the container's limit, while a
 * worker thread out of memory often took the whole server down with it.
 */
function indexInProcess(
	job: IndexJob,
	deadlineMs: number,
	heapMb: number | undefined
): Promise<{ pages: number; warnings: string[] }> {
	// The script runs from source; `#lib` points at it from the dev server, tests and the build.
	const script = fileURLToPath(import.meta.resolve('#lib/server/sync/index-worker.ts'));
	// Not the server's flags, such as a test runner's loader or an inspector port.
	const execArgv = heapMb === undefined ? [] : [`--max-old-space-size=${heapMb}`];
	const child = fork(script, { execArgv });
	child.send(job);
	return new Promise((resolve, reject) => {
		// A killed process holds no lock: SQLite rolls its open transaction back, and the rows it
		// already committed belong to a generation that never went live and go with the next sync.
		const deadline = setTimeout(() => {
			reject(new Error(`indexing took longer than ${formatDuration(deadlineMs)}`));
			child.kill('SIGKILL');
		}, deadlineMs);
		child.once('message', (outcome: IndexOutcome) => {
			if ('error' in outcome) reject(new Error(outcome.error));
			else resolve(outcome);
		});
		child.once('error', reject);
		child.once('close', (code, signal) => {
			clearTimeout(deadline);
			const ending = signal ?? `exit code ${code}`;
			reject(
				new Error(`indexing ended with ${ending} before it finished, out of memory for example`)
			);
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
