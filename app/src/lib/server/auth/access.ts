import type { DatabaseSync } from 'node:sqlite';
import { checkAdminAccount, type Role, type SessionUser } from './auth.ts';

// The roles each page needs, the first matching prefix decides; pages under no prefix need no
// login.
const PAGE_ROLES: [prefix: string, roles: Role[]][] = [['/manage', ['admin']]];

// Pages of the accounts themselves: they guide through setup and login whatever the roles.
const ACCOUNT_PAGES = ['/setup', '/login', '/logout', '/account'];

function isUnder(pathname: string, prefix: string): boolean {
	return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

/** Whether the user holds every role in `roles`. */
export function hasRoles(user: SessionUser, roles: Role[]): boolean {
	return roles.every((role) => user.roles.includes(role));
}

/** Whether the user has the roles `pathname` needs. */
export function mayOpen(user: SessionUser, pathname: string): boolean {
	const roles = PAGE_ROLES.find(([prefix]) => isUnder(pathname, prefix))?.[1];
	return roles === undefined || hasRoles(user, roles);
}

/** Where a new account lands on its first login: its API keys, with a welcome. */
export const WELCOME_PAGE = '/account/api-keys?welcome';

/** Where a user goes after logging in: the management area when they may open it. */
export function homeOf(user: SessionUser): string {
	return mayOpen(user, '/manage') ? '/manage' : '/';
}

/**
 * Where a request must go instead: the setup while there is no admin, the login without a user, `'not-found'` for the setup once it is done, `'forbidden'` for a page whose role the
 * user lacks; undefined to serve it. Pages that are neither account pages nor guarded by a role
 * are always served. Login, logout and the own account stay open to every user, so one without
 * a role can leave and log in as someone else. `pathname` is the matched route ID (such as
 * `/manage/sources/[id]`), never the raw request path, whose percent-escapes the router decodes.
 */
export function accessRedirect(
	db: DatabaseSync,
	pathname: string,
	user: SessionUser | undefined
): string | 'not-found' | 'forbidden' | undefined {
	const guarded = PAGE_ROLES.some(([prefix]) => isUnder(pathname, prefix));
	if (!guarded && !ACCOUNT_PAGES.some((page) => isUnder(pathname, page))) return undefined;
	if (!checkAdminAccount(db)) return pathname === '/setup' ? undefined : '/setup';
	if (pathname === '/setup') return 'not-found';
	// A link to set a password works for whoever opens it, logged in or not: the token decides.
	if (isUnder(pathname, '/login/reset')) return undefined;
	// The login and the request of a reset link below it need no session.
	if (isUnder(pathname, '/login')) return user ? homeOf(user) : undefined;
	if (!user) return '/login';
	return mayOpen(user, pathname) ? undefined : 'forbidden';
}
