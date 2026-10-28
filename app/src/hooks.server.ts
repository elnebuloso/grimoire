import type { ServerInit } from '@sveltejs/kit/hooks';
import { MIGRATE_ONLY } from '$app/env/private';
import { database } from '#lib/server/db/index.js';
import { startSyncPolling } from '#lib/server/sync/index.js';

// Migrates on start and fails fast on an unusable path. The server only listens once this has
// returned, so MIGRATE_ONLY exits before any request is served or any source is synced.
export const init: ServerInit = () => {
	const db = database();
	if (MIGRATE_ONLY) {
		db.close();
		process.exit(0);
	}
	startSyncPolling();
};
