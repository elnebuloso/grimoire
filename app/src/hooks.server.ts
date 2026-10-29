import { sequence, type Handle, type ServerInit } from '@sveltejs/kit/hooks';
import { error, redirect } from '@sveltejs/kit';
import { MIGRATE_ONLY } from '$app/env/private';
import { database } from '#lib/server/db/index.js';
import { startSyncPolling } from '#lib/server/sync/index.js';
import { adminAccessRedirect, checkAdminAccount, SESSION_COOKIE } from '#lib/server/admin/auth.js';
import { getTextDirection } from '#lib/paraglide/runtime.js';
import { paraglideMiddleware } from '#lib/paraglide/server.js';

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

export const handleAdminAccess: Handle = ({ event, resolve }) => {
	const { pathname } = event.url;
	if (pathname !== '/admin' && !pathname.startsWith('/admin/')) return resolve(event);
	const target = adminAccessRedirect(database(), pathname, event.cookies.get(SESSION_COOKIE));
	if (target === 'not-found') error(404);
	if (target) redirect(303, target);
	return resolve(event);
};

// Sets the language of the request, so pages and the messages of form actions use it.
const handleLanguage: Handle = ({ event, resolve }) =>
	paraglideMiddleware(event.request, ({ request, locale }) =>
		resolve(
			{ ...event, request },
			{
				transformPageChunk: ({ html }) =>
					html
						.replace('%paraglide.lang%', locale)
						.replace('%paraglide.dir%', getTextDirection(locale))
			}
		)
	);

export const handle = sequence(handleAdminAccess, handleLanguage);
