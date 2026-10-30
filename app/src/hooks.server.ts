import {
	sequence,
	type Handle,
	type HandleServerError,
	type ServerInit
} from '@sveltejs/kit/hooks';
import { error, redirect } from '@sveltejs/kit';
import { LOG_FORMAT, LOG_LEVEL, MIGRATE_ONLY } from '$app/env/private';
import { database } from '#lib/server/db/index.js';
import { configureLog, log, routeConsoleToLog } from '#lib/server/log.js';
import { startSyncPolling } from '#lib/server/sync/index.js';
import { mailer } from '#lib/server/mail/index.js';
import { accessRedirect, checkAdminAccount, SESSION_COOKIE } from '#lib/server/admin/auth.js';
import { getTextDirection } from '#lib/paraglide/runtime.js';
import { paraglideMiddleware } from '#lib/paraglide/server.js';

// Migrates on start and fails fast on an unusable path. The server only listens once this has
// returned, so MIGRATE_ONLY exits before any request is served or any source is synced.
export const init: ServerInit = () => {
	configureLog({ format: LOG_FORMAT, level: LOG_LEVEL });
	routeConsoleToLog();
	const db = database();
	if (MIGRATE_ONLY) {
		db.close();
		process.exit(0);
	}
	// Logs the setup token right away when there is no admin account yet.
	checkAdminAccount(db);
	// Fails the start on incomplete SMTP settings instead of at the first mail.
	mailer();
	startSyncPolling();
};

// Replaces SvelteKit's default, which logs only unexpected errors; 404s and the like stay quiet.
export const handleError: HandleServerError = ({ error, event, kind }) => {
	if (kind !== 'unknown') return;
	log.error({ err: error }, `${event.request.method} ${event.url.pathname} failed`);
};

// Decides on the route the router matched, not on `event.url.pathname`: the router decodes the
// path, so `/m%61nage` runs the `/manage` page while its raw pathname matches no guarded prefix.
// A path without a route has nothing to guard and ends in a 404.
export const handleAccess: Handle = ({ event, resolve }) => {
	if (event.route.id === null) return resolve(event);
	const target = accessRedirect(database(), event.route.id, event.cookies.get(SESSION_COOKIE));
	if (target === 'not-found') error(404);
	if (target === 'forbidden') error(403);
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

export const handle = sequence(handleAccess, handleLanguage);
