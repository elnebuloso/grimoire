import { SYNC_SCHEDULE, TOKEN_ENCRYPTION_KEY } from '$app/env/private';
import { database } from '../db';
import { listSchedules, recordSyncError } from '../db/sources';
import { createSyncQueue, startPolling } from './queue';
import { isDue } from './schedule';
import { syncSource } from './sync';

// How late a scheduled check may start at most; listing 200 sources this often costs nothing.
const TICK_MS = 15_000;

const queue = createSyncQueue((sourceId, force, lanes) =>
	syncSource(database(), sourceId, { key: TOKEN_ENCRYPTION_KEY, force, lanes })
);

/** Syncs one source as soon as the syncs before it are done, e.g. for "sync now". */
export const requestSync = queue.request;

/** Checks every source whenever its schedule – its own, or `SYNC_SCHEDULE` – says so. */
export function startSyncPolling(): () => void {
	return startPolling(queue, dueSources, TICK_MS);
}

function dueSources(): number[] {
	const db = database();
	const now = new Date();
	return listSchedules(db)
		.filter(({ id, schedule, lastCheckedAt }) => {
			try {
				return isDue(schedule ?? SYNC_SCHEDULE, lastCheckedAt, now);
			} catch (error) {
				recordSyncError(db, id, (error as Error).message);
				return false;
			}
		})
		.map(({ id }) => id);
}
