import { fork } from 'node:child_process';
import { mkdirSync, rmSync } from 'node:fs';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import type { DatabaseSync } from 'node:sqlite';
import { fileURLToPath } from 'node:url';
import {
	clearSyncError,
	deleteStaleIndex,
	forgetIndexedCommit,
	indexSettingsChanged,
	recordCheck,
	recordSyncError,
	recordSyncRun,
	sourceForSync
} from '../db/sources';
import { decryptSecret } from '../secret-encryption';
import { sha256 } from '../sha256';
import { ConnectionRefused, type ConnectionPolicy } from './connection-policy';
import { syncErrorKind } from './error-kind';
import { SyncFailure, TIMED_OUT, type SyncErrorKind } from './failure';
import { headCommit, redact, remoteCommit, sparseClone, type GitRemote } from './git';
import type { IndexJob, IndexOutcome } from './index-worker';
import { pageBeingIndexed } from './page-log';
import type { SyncLanes } from './queue';

const IMMEDIATELY: SyncLanes = { check: (work) => work(), sync: (work) => work() };

export interface SyncOptions {
	/** The key of the stored access tokens, derived from `ENCRYPTION_KEY`. */
	key: Buffer;
	/** Where Git may connect: `connectionPolicy` of the running server. */
	policy: ConnectionPolicy;
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
	/** The script of the indexing process; tests put a stand-in there. */
	indexingScript?: string;
}

// A large real source takes about a minute. Without a deadline, content that keeps the indexing
// busy would hold the single sync slot, and with it every other source, until a restart.
const INDEXING_DEADLINE_MS = 10 * 60_000;

export type SyncResult =
	| { status: 'unchanged'; commit: string }
	| {
			status: 'synced';
			commit: string;
			pages: number;
			warnings: string[];
			/** The most memory the indexing process held, in KiB. */
			peakMemoryKb?: number;
	  }
	/** `commit` is the one that failed to index; undefined when the sync failed before one was known. */
	| { status: 'failed'; error: string; kind: SyncErrorKind; commit?: string };

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
		error: result.status === 'failed' ? result.error : null,
		errorKind: result.status === 'failed' ? result.kind : null
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
	let remote: GitRemote = {
		url: source.gitUrl,
		username: source.username,
		policy: options.policy
	};
	// Set again when the check really starts; also recorded when it never got that far, so a
	// broken source waits for its next scheduled run instead of being retried on every tick.
	let checkedAt = new Date();
	let cloningCommit: string | undefined;
	let indexingCommit: string | undefined;

	try {
		remote = { ...remote, token: storedToken(source.encryptedToken, options.key) };

		const latest = await lanes.check(() => {
			checkedAt = new Date();
			// Recorded now, not only at the end: a process that dies in the sync stage (out of memory,
			// say) would otherwise find the source due again on restart and die again, every start.
			recordCheck(db, sourceId, checkedAt);
			return remoteCommit(remote, source.branch);
		});
		if (latest === source.lastCommit && !options.force) {
			clearSyncError(db, sourceId);
			// An indexing process stopped after its index went live leaves the one before behind.
			await deleteStaleIndex(db, sourceId);
			return { status: 'unchanged', commit: latest };
		}
		// Indexing the same commit again fails the same way, and a run up to the deadline would
		// otherwise hold the single sync slot in every interval; a new commit or a forced run retries.
		// Only while the stored failure is one that repeats: a network error since then passes.
		const storedKind = source.error ? (source.errorKind ?? syncErrorKind(source.error)) : null;
		if (
			latest === source.failedCommit &&
			storedKind &&
			repeats(storedKind, source.error!) &&
			!options.force
		) {
			return { status: 'failed', error: source.error!, kind: storedKind, commit: latest };
		}

		cloningCommit = latest;
		const synced = await lanes.sync(async () => {
			const checkout = await mkdtemp(join(options.workDirectory ?? tmpdir(), 'grimoire-sync-'));
			const pageLog = `${checkout}.pages`;
			try {
				await sparseClone(remote, source.branch, source.path, checkout);
				const commit = await headCommit(checkout);
				indexingCommit = commit;
				const indexed = await indexInProcess(
					{
						checkout,
						source: { path: source.path, exclusions: source.exclusions },
						remote,
						allowedIncludeOrigins: options.allowedIncludeOrigins ?? [],
						databasePath: databasePath(db),
						sourceId,
						branch: source.branch,
						commit,
						serverPid: process.pid,
						pageLog
					},
					options.indexingDeadlineMs ?? INDEXING_DEADLINE_MS,
					options.indexingHeapMb,
					options.indexingScript
				);
				return { status: 'synced' as const, commit, ...indexed };
			} finally {
				await rm(checkout, { recursive: true, force: true });
				await rm(pageLog, { force: true });
			}
		});
		if (indexSettingsChanged(db, source)) forgetIndexedCommit(db, sourceId);
		return synced;
	} catch (error) {
		const message = redact((error as Error).message, remote);
		const kind = failureKind(error as Error);
		// Once indexing started, the commit is remembered as failed when the failure repeats, and
		// forgotten when it passes, so an older failure of the same commit no longer holds it back.
		// A clone that repeats, such as one stopped at its time limit, is remembered by the commit
		// the check saw: retried every interval, it would hold the single sync slot for good.
		const repeating = repeats(kind, message);
		const remembered = repeating && !indexSettingsChanged(db, source);
		const attempted = indexingCommit ?? (repeating ? cloningCommit : undefined);
		const failedCommit = attempted === undefined ? undefined : remembered ? attempted : null;
		recordSyncError(db, sourceId, { message, kind }, failedCommit);
		return { status: 'failed', error: message, kind, commit: indexingCommit };
	} finally {
		recordCheck(db, sourceId, checkedAt);
	}
}

// Indexing the same commit again fails the same way for these; a network error or a locked
// database while indexing passes, so its commit is tried again at the next check.
const REPEATING_KINDS = new Set<SyncErrorKind>(['noPage', 'path', 'deadline', 'aborted']);

function repeats(kind: SyncErrorKind, message: string): boolean {
	return REPEATING_KINDS.has(kind) || TIMED_OUT.test(message);
}

function failureKind(error: Error): SyncErrorKind {
	if (error instanceof SyncFailure) return error.kind;
	if (error instanceof ConnectionRefused) return 'forbidden';
	// Thrown outside grimoire's own code, such as Node's name lookup: only the message tells.
	return syncErrorKind(error.message);
}

/**
 * The directory the syncs of the database at `databasePath` clone into, below `base`, emptied:
 * a process killed during a sync leaves its clone there. Another database on the same host, such
 * as the second instance of the e2e tests, has a directory of its own.
 */
export function freshWorkDirectory(databasePath: string, base = tmpdir()): string {
	const directory = join(base, `grimoire-work-${sha256(resolve(databasePath)).slice(0, 12)}`);
	rmSync(directory, { recursive: true, force: true });
	mkdirSync(directory, { recursive: true });
	return directory;
}

function storedToken(encryptedToken: string | null, key: Buffer): string | undefined {
	if (!encryptedToken) return undefined;
	try {
		return decryptSecret(encryptedToken, key);
	} catch {
		throw new SyncFailure(
			'access',
			'the stored access token cannot be decrypted with the current key: enter it again on the source page'
		);
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
	heapMb: number | undefined,
	// The script runs from source; `#lib` points at it from the dev server, tests and the build.
	script = fileURLToPath(import.meta.resolve('#lib/server/sync/index-worker.ts'))
): Promise<{ pages: number; warnings: string[]; peakMemoryKb?: number }> {
	// Not the server's flags, such as a test runner's loader or an inspector port.
	const execArgv = heapMb === undefined ? [] : [`--max-old-space-size=${heapMb}`];
	// In a process group of its own, so the deadline also stops the git it started: killing the
	// process alone would leave git running without its timeout, which lived in the process.
	const child = fork(script, { execArgv, detached: true });
	child.send(job);
	// Its own group no longer gets the signals of the server's, such as Ctrl+C in a terminal: when
	// the server exits, the group is stopped with it instead of writing on as an orphan.
	const stopWithServer = () => killGroup(child.pid);
	process.once('exit', stopWithServer);
	return new Promise((resolve, reject) => {
		// A killed process holds no lock: SQLite rolls its open transaction back, and the rows it
		// already committed belong to a generation that never went live and go with the next sync.
		const deadline = setTimeout(() => {
			reject(
				new SyncFailure(
					'deadline',
					`indexing took longer than ${formatDuration(deadlineMs)}${whileIndexing(job.pageLog)}`
				)
			);
			killGroup(child.pid);
		}, deadlineMs);
		child.once('message', (outcome: IndexOutcome) => {
			if (!('error' in outcome)) resolve(outcome);
			else if (outcome.kind) reject(new SyncFailure(outcome.kind, outcome.error));
			else reject(new Error(outcome.error));
		});
		child.once('error', reject);
		child.once('close', (code, signal) => {
			clearTimeout(deadline);
			process.off('exit', stopWithServer);
			const ending = signal ?? `exit code ${code}`;
			reject(
				new SyncFailure(
					'aborted',
					`indexing ended with ${ending} before it finished${whileIndexing(job.pageLog)}, out of memory for example`
				)
			);
		});
	});
}

function whileIndexing(pageLog: string): string {
	const page = pageBeingIndexed(pageLog);
	return page === undefined ? '' : `, while indexing ${page}`;
}

function killGroup(pid: number | undefined) {
	if (pid === undefined) return;
	try {
		process.kill(-pid, 'SIGKILL');
	} catch {
		// Gone already: it ended between the deadline and the kill.
	}
}

function formatDuration(ms: number): string {
	return ms >= 60_000 ? `${ms / 60_000} minutes` : `${ms / 1000} seconds`;
}

function databasePath(db: DatabaseSync): string {
	const path = db.location();
	if (!path) throw new Error('a source can only be indexed into a database file');
	return path;
}
