import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { DatabaseSync } from 'node:sqlite';
import { clearSyncError, recordSyncError, replaceSourceIndex, sourceForSync } from '../db/sources';
import { decryptToken } from '../token-encryption';
import {
	addSparseDirectories,
	headCommit,
	redact,
	remoteCommit,
	sparseClone,
	type GitRemote
} from './git';
import { indexCheckout } from './index-source';
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
}

export type SyncResult =
	| { status: 'unchanged'; commit: string }
	| { status: 'synced'; commit: string; pages: number; warnings: string[] }
	| { status: 'failed'; error: string };

/**
 * Brings one source into the index: checks the branch with `ls-remote`, and when it moved, clones
 * the source path into a temporary directory, indexes it and replaces the source's pages in one
 * transaction. On failure the previous index stays active and the error is stored on the source.
 */
export async function syncSource(
	db: DatabaseSync,
	sourceId: number,
	options: SyncOptions
): Promise<SyncResult> {
	const source = sourceForSync(db, sourceId);
	const lanes = options.lanes ?? IMMEDIATELY;
	let remote: GitRemote = { url: source.gitUrl, username: source.username };

	try {
		const token = source.encryptedToken && decryptToken(source.encryptedToken, options.key);
		remote = { ...remote, token };

		const latest = await lanes.check(() => remoteCommit(remote, source.branch));
		if (latest === source.lastCommit && !options.force) {
			clearSyncError(db, sourceId);
			return { status: 'unchanged', commit: latest };
		}

		return await lanes.sync(async () => {
			const checkout = await mkdtemp(join(options.workDirectory ?? tmpdir(), 'grimoire-sync-'));
			try {
				await sparseClone(remote, source.branch, source.path, checkout);
				const commit = await headCommit(checkout);
				const index = await indexCheckout(checkout, source, (directories) =>
					addSparseDirectories(remote, checkout, directories)
				);
				replaceSourceIndex(db, sourceId, { commit, ...index });
				return {
					status: 'synced' as const,
					commit,
					pages: index.pages.length,
					warnings: index.warnings
				};
			} finally {
				await rm(checkout, { recursive: true, force: true });
			}
		});
	} catch (error) {
		const message = redact((error as Error).message, remote);
		recordSyncError(db, sourceId, message);
		return { status: 'failed', error: message };
	}
}
