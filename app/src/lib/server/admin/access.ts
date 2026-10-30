import type { DatabaseSync } from 'node:sqlite';
import { checkAdminAccount, sessionUser, type Role, type SessionUser } from './auth.ts';

// The role each page needs, the first matching prefix decides; pages under no prefix need none.
// Today the whole management area needs `admin`; a page another role may open gets its own,
// longer prefix before that line.
const PAGE_ROLES: [prefix: string, role: Role][] = [['/manage', 'admin']];

// Pages of the accounts themselves: they guide through setup and login whatever the roles.
const ACCOUNT_PAGES = ['/setup', '/login', '/logout', '/account'];

function isUnder(pathname: string, prefix: string): boolean {
	return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

/** Whether the user has the role `pathname` needs. */
export function mayOpen(user: SessionUser, pathname: string): boolean {
	const role = PAGE_ROLES.find(([prefix]) => isUnder(pathname, prefix))?.[1];
	return role === undefined || user.roles.includes(role);
}

/** Where a user goes after logging in: the management area when they may open it. */
export function homeOf(user: SessionUser): string {
	return mayOpen(user, '/manage') ? '/manage' : '/';
}

/**
 * Where a request must go instead: the setup while there is no admin, the login without a valid
 * session, `'not-found'` for the setup once it is done, `'forbidden'` for a page whose role the
 * user lacks; undefined to serve it. Pages that are neither account pages nor guarded by a role
 * are always served. Login, logout and the own account stay open to every user, so one without
 * a role can leave and log in as someone else. `pathname` is the matched route ID (such as
 * `/manage/sources/[id]`), never the raw request path, whose percent-escapes the router decodes.
 */
export function accessRedirect(
	db: DatabaseSync,
	pathname: string,
	session: string | undefined
): string | 'not-found' | 'forbidden' | undefined {
	const guarded = PAGE_ROLES.some(([prefix]) => isUnder(pathname, prefix));
	if (!guarded && !ACCOUNT_PAGES.some((page) => isUnder(pathname, page))) return undefined;
	if (!checkAdminAccount(db)) return pathname === '/setup' ? undefined : '/setup';
	if (pathname === '/setup') return 'not-found';
	const user = sessionUser(db, session);
	// The login and the reset of a forgotten password below it need no session.
	if (isUnder(pathname, '/login')) return user && mayOpen(user, '/manage') ? '/manage' : undefined;
	if (!user) return '/login';
	return mayOpen(user, pathname) ? undefined : 'forbidden';
}
