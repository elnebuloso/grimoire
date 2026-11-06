import {
	sequence,
	type Handle,
	type HandleServerError,
	type ServerInit
} from '@sveltejs/kit/hooks';
import { error, redirect, type RequestEvent } from '@sveltejs/kit';
import { LOG_FORMAT, LOG_LEVEL, MIGRATE_ONLY } from '$app/env/private';
import { database } from '#lib/server/db/index.js';
import { configureLog, log, routeConsoleToLog } from '#lib/server/log.js';
import { logRefusedSources, startSyncPolling } from '#lib/server/sync/index.js';
import { mailer } from '#lib/server/mail/index.js';
import { checkOidcProviders } from '#lib/server/oidc/index.js';
import { accessRedirect } from '#lib/server/auth/access.js';
import {
	checkAdminAccount,
	SESSION_COOKIE,
	sessionUser,
	touchSession
} from '#lib/server/auth/auth.js';
import { THEME_COOKIE, themeAttribute } from '#lib/theme.js';
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
	checkOidcProviders();
	startSyncPolling();
	// Looks up every Git host: the server must not wait for that before it listens.
	void logRefusedSources().catch((error) => log.error({ err: error }, 'checking Git hosts failed'));
};

// Replaces SvelteKit's default, which logs only unexpected errors; 404s and the like stay quiet.
export const handleError: HandleServerError = ({ error, event, kind }) => {
	if (kind !== 'unknown') return;
	// The route, not the address: reset and invitation links carry their token in the path.
	const path = event.route.id ?? event.url.pathname;
	log.error({ err: error }, `${event.request.method} ${path} failed`);
};

// grimoire is an internal tool: nothing it serves belongs in a search index, neither the pages nor
// the documentation the agent routes serve as text. The header also reaches what is not HTML.
export const handleRobots: Handle = ({ event, resolve }) => {
	event.setHeaders({ 'X-Robots-Tag': 'noindex, nofollow' });
	return resolve(event);
};

const SERVER_ROUTES = Object.keys(import.meta.glob('./routes/**/+server.ts')).map(
	(file) => file.slice('./routes'.length, -'/+server.ts'.length) || '/'
);

// Route IDs of the pages that are not also endpoints, such as `/manage/sources/[id]`.
const PAGE_ROUTES = new Set(
	Object.keys(import.meta.glob('./routes/**/+page.svelte'))
		.map((file) => file.slice('./routes'.length, -'/+page.svelte'.length) || '/')
		.filter((route) => !SERVER_ROUTES.includes(route))
);

// Decides on the route the router matched, not on `event.url.pathname`: the router decodes the
// path, so `/m%61nage` runs the `/manage` page while its raw pathname matches no guarded prefix.
// A path without a route has nothing to guard and ends in a 404.
export const handleAccess: Handle = async ({ event, resolve }) => {
	const db = database();
	const session = event.cookies.get(SESSION_COOKIE);
	// Read once, for every request: also a page that does not exist shows who is logged in.
	event.locals.user = sessionUser(db, session);
	if (event.route.id === null) return resolve(event);
	if (event.locals.user && !BACKGROUND_ROUTES.has(event.route.id)) touchSession(db, session);
	const target = accessRedirect(db, event.route.id, event.locals.user);
	if (target === 'not-found' || target === 'forbidden') {
		const status = target === 'not-found' ? 404 : 403;
		// Thrown here, SvelteKit answers with its bare fallback page; thrown by a page's load, it
		// renders +error.svelte in the layout. Only a plain page view can take that way round:
		// form actions run before any load, endpoints have none.
		if (event.request.method !== 'GET' || event.isDataRequest || !PAGE_ROUTES.has(event.route.id)) {
			error(status);
		}
		event.locals.accessDenied = status;
		const response = await resolve(event);
		// A page whose load does not throw it would be served: never send that response.
		if (response.status !== status) error(status);
		return response;
	}
	if (target === '/login' && event.route.id !== '/logout') redirect(303, loginReturningTo(event));
	if (target) redirect(303, target);
	return resolve(event);
};

// Requests a page sends on its own, not its user: they must not keep an idle session alive.
const BACKGROUND_ROUTES = new Set(['/manage/sources/[id]/sync-pending']);

/** The login, which sends the user back to the page they asked for; a form's action name is dropped. */
function loginReturningTo({ url, request }: RequestEvent): string {
	const page = request.method === 'GET' ? url.pathname + url.search : url.pathname;
	return `/login?next=${encodeURIComponent(page)}`;
}

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

// Renders the picked scheme into the page itself, so it paints in it from the start, script or not.
const handleTheme: Handle = ({ event, resolve }) =>
	resolve(event, {
		transformPageChunk: ({ html }) =>
			html.replace('%grimoire.theme%', themeAttribute(event.cookies.get(THEME_COOKIE)))
	});

export const handle = sequence(handleRobots, handleAccess, handleLanguage, handleTheme);
