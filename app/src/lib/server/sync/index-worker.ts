// Entry of the worker thread that indexes a source. Node loads it from source, outside Vite, so
// this file and every module it imports use relative imports with their `.ts` extension and
// nothing Vite resolves (`#lib`, `$app`).
import { DatabaseSync } from 'node:sqlite';
import { parentPort, workerData } from 'node:worker_threads';
import { replaceSourceIndex } from '../db/sources.ts';
import { addSparseDirectories, type GitRemote } from './git.ts';
import { indexPages } from './index-pages.ts';
import { prepareCheckout, type IndexedSource } from './index-source.ts';
import { fetchInclude } from './url-include.ts';

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
	commit: string;
}

const job = workerData as IndexJob;
const prepared = await prepareCheckout(
	job.checkout,
	job.source,
	(directories) => addSparseDirectories(job.remote, job.checkout, directories),
	(url) => fetchInclude(url, job.allowedIncludeOrigins)
);
const index = indexPages(prepared);
// Its own connection: the server's stays free for requests, which keep reading the old index
// until this transaction commits.
const db = new DatabaseSync(job.databasePath, { timeout: 30_000 });
try {
	db.exec('PRAGMA foreign_keys = ON');
	replaceSourceIndex(db, job.sourceId, { commit: job.commit, ...index });
} finally {
	db.close();
}
parentPort!.postMessage({ pages: index.pages.length, warnings: index.warnings });
