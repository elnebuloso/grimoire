import {
	GIT_ALLOWED_HOSTS,
	INCLUDE_URL_ALLOW,
	INDEXING_DEADLINE_MINUTES,
	SYNC_SCHEDULE,
	ENCRYPTION_KEY,
	TZ
} from '$app/env/private';
import { database } from '../db';
import { listSchedules, recordSyncError } from '../db/sources';
import { createSyncQueue, startPolling } from './queue';
import { isDue } from './schedule';
import { syncSource } from './sync';
import { log } from '../log';
import { connectionPolicy, refusedSources } from './connection-policy';

// How late a scheduled check may start at most; listing 200 sources this often costs nothing.
const TICK_MS = 15_000;

const queue = createSyncQueue((sourceId, force, lanes) =>
	syncSource(database(), sourceId, {
		key: ENCRYPTION_KEY.sourceTokens,
		policy: connectionPolicy(GIT_ALLOWED_HOSTS),
		force,
		lanes,
		allowedIncludeOrigins: INCLUDE_URL_ALLOW,
		indexingDeadlineMs: INDEXING_DEADLINE_MINUTES * 60_000
	})
);

/** Syncs one source as soon as the syncs before it are done, e.g. for "sync now". */
export const requestSync = queue.request;

/** Queues a sync of one source without waiting for it, e.g. after saving it or "sync now". */
export const requestSyncInBackground = queue.requestInBackground;

/** Whether a sync of the source is queued or running. */
export const syncPending = queue.isPending;

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
				return isDue(schedule ?? SYNC_SCHEDULE, lastCheckedAt, now, TZ);
			} catch (error) {
				recordSyncError(db, id, { message: (error as Error).message, kind: 'unknown' });
				return false;
			}
		})
		.map(({ id }) => id);
}

/**
 * Logs every source whose Git host the server may not connect to, such as an internal one not in
 * `GIT_ALLOWED_HOSTS` after an update: its syncs fail from now on. Not awaited by the start.
 */
export async function logRefusedSources(): Promise<void> {
	for (const { slug, reason } of await refusedSources(
		database(),
		connectionPolicy(GIT_ALLOWED_HOSTS)
	)) {
		log.warn(`source ${slug} cannot sync: ${reason}`);
	}
}
