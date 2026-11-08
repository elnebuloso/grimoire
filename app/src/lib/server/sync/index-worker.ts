// Entry of the child process that indexes a source. Node loads it from source, outside Vite, so
// this file and every module it imports use relative imports with their `.ts` extension and
// nothing Vite resolves (`#lib`, `$app`).
import { DatabaseSync } from 'node:sqlite';
import { replaceSourceIndex } from '../db/sources.ts';
import { addSparseDirectories, type GitRemote } from './git.ts';
import { indexPages } from './index-pages.ts';
import { SyncFailure, type SyncErrorKind } from './failure.ts';
import { prepareCheckout, type IndexedSource } from './index-source.ts';
import { fetchInclude } from './url-include.ts';

/** Sent by the server over the IPC channel, not as arguments: it can carry the Git token. */
export interface IndexJob {
	/** Directory of the sparse clone. */
	checkout: string;
	source: IndexedSource;
	/** For checking out further directories that includes point to. */
	remote: GitRemote;
	/** Value of `INCLUDE_URL_ALLOW`. */
	allowedIncludeOrigins: string[];
	databasePath: string;
	sourceId: number;
	branch: string;
	commit: string;
	/** The server process that waits for the result. */
	serverPid: number;
}

export type IndexOutcome =
	| {
			pages: number;
			warnings: string[];
			/** The most memory the indexing process held, in KiB, for the benchmark. */
			peakMemoryKb?: number;
	  }
	| { error: string; kind?: SyncErrorKind };

async function index(job: IndexJob): Promise<IndexOutcome> {
	const prepared = await prepareCheckout(
		job.checkout,
		job.source,
		(directories) => addSparseDirectories(job.remote, job.checkout, directories),
		(url) => fetchInclude(url, job.allowedIncludeOrigins)
	);
	const index = indexPages(prepared);
	// A server that died of a signal, such as Ctrl+C, never disconnects in time: indexing runs
	// without giving the event loop a turn, and an orphan would write while the next server starts.
	if (process.ppid !== job.serverPid) process.exit(1);
	// Its own connection: the server's stays free for requests, which keep reading the old index
	// until this transaction commits.
	const db = new DatabaseSync(job.databasePath, { timeout: 30_000 });
	try {
		db.exec('PRAGMA foreign_keys = ON');
		const startedFrom = {
			gitUrl: job.remote.url,
			branch: job.branch,
			path: job.source.path,
			exclusions: job.source.exclusions
		};
		const live = replaceSourceIndex(
			db,
			job.sourceId,
			{ commit: job.commit, ...index },
			{ startedFrom }
		);
		if (!live) {
			throw new SyncFailure(
				'unknown',
				'the source was changed or deleted while this sync waited; the next sync indexes it as it is now'
			);
		}
	} finally {
		db.close();
	}
	return {
		pages: index.pages.length,
		warnings: index.warnings,
		peakMemoryKb: process.resourceUsage().maxRSS
	};
}

// Without the server nobody waits for the result; stop rather than write on as an orphan.
const stop = () => process.exit(1);
process.once('disconnect', stop);
process.once('message', async (job: IndexJob) => {
	const outcome = await index(job).catch((error: Error) => ({
		error: error.message,
		kind: error instanceof SyncFailure ? error.kind : undefined
	}));
	process.off('disconnect', stop);
	process.send!(outcome, () => process.disconnect());
});
