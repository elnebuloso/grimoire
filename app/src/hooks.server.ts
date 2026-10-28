import type { Handle, ServerInit } from '@sveltejs/kit/hooks';
import { error, redirect } from '@sveltejs/kit';
import { MIGRATE_ONLY } from '$app/env/private';
import { database } from '#lib/server/db/index.js';
import { startSyncPolling } from '#lib/server/sync/index.js';
import { adminAccessRedirect, checkAdminAccount, SESSION_COOKIE } from '#lib/server/admin/auth.js';

// Migrates on start and fails fast on an unusable path. The server only listens once this has
// returned, so MIGRATE_ONLY exits before any request is served or any source is synced.
export const init: ServerInit = () => {
	const db = database();
	if (MIGRATE_ONLY) {
		db.close();
		process.exit(0);
	}
	// Logs the setup token right away when there is no admin account yet.
	checkAdminAccount(db);
	startSyncPolling();
};

export const handle: Handle = ({ event, resolve }) => {
	const { pathname } = event.url;
	if (pathname !== '/admin' && !pathname.startsWith('/admin/')) return resolve(event);
	const target = adminAccessRedirect(database(), pathname, event.cookies.get(SESSION_COOKIE));
	if (target === 'not-found') error(404);
	if (target) redirect(303, target);
	return resolve(event);
};
