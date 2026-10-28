import { SYNC_INTERVAL_MINUTES, TOKEN_ENCRYPTION_KEY } from '$app/env/private';
import { database } from '../db';
import { listSourceIds } from '../db/sources';
import { createSyncQueue, startPolling } from './queue';
import { syncSource } from './sync';

const queue = createSyncQueue((sourceId, force, lanes) =>
	syncSource(database(), sourceId, { key: TOKEN_ENCRYPTION_KEY, force, lanes })
);

/** Syncs one source as soon as the syncs before it are done, e.g. for "sync now". */
export const requestSync = queue.request;

/** Checks every source for new commits now and every `SYNC_INTERVAL_MINUTES`. */
export function startSyncPolling(): () => void {
	return startPolling(queue, () => listSourceIds(database()), SYNC_INTERVAL_MINUTES * 60_000);
}
