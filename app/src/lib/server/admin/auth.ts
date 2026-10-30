import { createHash, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import type { DatabaseSync } from 'node:sqlite';
// With its extension: the scripts in `scripts/` load this file with plain node.
import { log, logAlways } from '../log.ts';

export const SESSION_COOKIE = 'grimoire_session';
// Every page shows whether the admin is logged in, so the cookie goes to the whole site; no
// other site may send it along.
export const sessionCookieOptions = { path: '/', httpOnly: true, sameSite: 'strict' } as const;

export const MIN_PASSWORD_LENGTH = 12;

/** What a user may do; `admin` manages everything in the management area. */
export const ROLES = ['admin'] as const;
export type Role = (typeof ROLES)[number];

/** The user a session belongs to. */
export interface SessionUser {
	id: number;
	username: string;
	roles: Role[];
}
const SESSION_HOURS = 12;
const MAX_FAILED_LOGINS = 10;
const BLOCK_MINUTES = 15;

/**
 * Why a setup, login or password change was refused. A code rather than a text: `scripts/` load
 * this file with plain Node, where the translated messages are not available.
 */
export type AuthProblem =
	| 'admin-exists'
	| 'wrong-setup-token'
	| 'username-missing'
	| 'password-too-short'
	| 'blocked'
	| 'wrong-credentials'
	| 'wrong-current-password'
	| 'new-password-too-short';

// Kept in memory only: it exists solely to prove access to the server log, so it is never stored.
let setupTokenValue: string | undefined;
let adminSeen = false;
// ponytail: failed logins are counted in memory per client and forgotten on restart; enough for
// one instance, a table if grimoire ever runs on several.
const failedLogins = new Map<string, { count: number; blockedUntil: number }>();

function sha256(value: string): string {
	return createHash('sha256').update(value).digest('hex');
}

function sameText(a: string, b: string): boolean {
	return timingSafeEqual(Buffer.from(sha256(a)), Buffer.from(sha256(b)));
}

export function hashPassword(password: string): string {
	const salt = randomBytes(16);
	return `${salt.toString('base64')}$${scryptSync(password, salt, 64).toString('base64')}`;
}

function passwordMatches(password: string, stored: string): boolean {
	const [salt, hash] = stored.split('$');
	const expected = Buffer.from(hash, 'base64');
	return timingSafeEqual(
		scryptSync(password, Buffer.from(salt, 'base64'), expected.length),
		expected
	);
}

// Compared against when a username is unknown, so a login takes as long as with a known one.
let unknownUserHash: string | undefined;

function findUser(db: DatabaseSync, username: string) {
	return db
		.prepare('SELECT id, username, password_hash FROM users WHERE username = ?')
		.get(username) as { id: number; username: string; password_hash: string } | undefined;
}

function adminExists(db: DatabaseSync): boolean {
	return db.prepare("SELECT 1 FROM user_roles WHERE role = 'admin'").get() !== undefined;
}

/** Creates a user with the given roles; the username must be free. Returns the new id. */
export function createUser(
	db: DatabaseSync,
	form: { username: string; password: string; roles: Role[] }
): number {
	db.exec('BEGIN IMMEDIATE');
	try {
		const { lastInsertRowid } = db
			.prepare('INSERT INTO users (username, password_hash) VALUES (?, ?)')
			.run(form.username, hashPassword(form.password));
		for (const role of form.roles) {
			db.prepare('INSERT INTO user_roles (user_id, role) VALUES (?, ?)').run(lastInsertRowid, role);
		}
		db.exec('COMMIT');
		return Number(lastInsertRowid);
	} catch (error) {
		if (db.isTransaction) db.exec('ROLLBACK');
		throw error;
	}
}

/**
 * Whether a user with the role `admin` exists. While none does, a setup token is created and
 * written to the log once; the last admin disappearing while the server runs is reported as a reset.
 */
export function checkAdminAccount(db: DatabaseSync): boolean {
	if (adminExists(db)) {
		adminSeen = true;
		setupTokenValue = undefined;
		return true;
	}
	if (adminSeen) {
		adminSeen = false;
		log.warn('Admin account was reset.');
	}
	if (!setupTokenValue) {
		setupTokenValue = randomBytes(24).toString('base64url');
		logAlways(`No admin account yet. Set it up at /setup with the setup token ${setupTokenValue}`);
	}
	return false;
}

/** Creates the first user, with the role `admin`; returns why when it cannot. */
export function setupAdmin(
	db: DatabaseSync,
	form: { token: string; username: string; password: string }
): AuthProblem | undefined {
	if (checkAdminAccount(db)) return 'admin-exists';
	if (!setupTokenValue || !sameText(form.token, setupTokenValue)) return 'wrong-setup-token';
	if (!form.username.trim()) return 'username-missing';
	if (form.password.length < MIN_PASSWORD_LENGTH) return 'password-too-short';
	createUser(db, { username: form.username.trim(), password: form.password, roles: ['admin'] });
	checkAdminAccount(db);
	return undefined;
}

/**
 * Checks the credentials of one client. Returns a new session token, or why not; a client is
 * blocked for a while after too many failures.
 */
export function login(
	db: DatabaseSync,
	client: string,
	form: { username: string; password: string },
	now = new Date()
): { session: string } | { error: AuthProblem } {
	if (isBlocked(client, now)) return { error: 'blocked' };
	const user = findUser(db, form.username);
	// A password is checked even for an unknown username, so the answer time does not tell which.
	unknownUserHash ??= hashPassword(randomBytes(16).toString('hex'));
	const matches = passwordMatches(form.password, user?.password_hash ?? unknownUserHash);
	if (!user || !matches) {
		recordFailedLogin(client, now);
		return { error: 'wrong-credentials' };
	}
	failedLogins.delete(client);
	return { session: createSession(db, user.id, now) };
}

function isBlocked(client: string, now: Date): boolean {
	return (failedLogins.get(client)?.blockedUntil ?? 0) > now.getTime();
}

function recordFailedLogin(client: string, now: Date) {
	const count = (failedLogins.get(client)?.count ?? 0) + 1;
	failedLogins.set(client, {
		count: count >= MAX_FAILED_LOGINS ? 0 : count,
		blockedUntil: count >= MAX_FAILED_LOGINS ? now.getTime() + BLOCK_MINUTES * 60_000 : 0
	});
}

/**
 * Replaces the password of the user of `session` and ends every other session of that user.
 * A wrong current password counts as a failed login of `client`. Returns why when nothing was
 * changed.
 */
export function changePassword(
	db: DatabaseSync,
	client: string,
	session: string,
	form: { current: string; password: string },
	now = new Date()
): AuthProblem | undefined {
	if (isBlocked(client, now)) return 'blocked';
	const user = sessionUser(db, session, now);
	const stored = user && findUser(db, user.username);
	if (!stored || !passwordMatches(form.current, stored.password_hash)) {
		recordFailedLogin(client, now);
		return 'wrong-current-password';
	}
	failedLogins.delete(client);
	if (form.password.length < MIN_PASSWORD_LENGTH) return 'new-password-too-short';
	db.exec('BEGIN IMMEDIATE');
	try {
		db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(
			hashPassword(form.password),
			stored.id
		);
		db.prepare('DELETE FROM sessions WHERE user_id = ? AND token_hash != ?').run(
			stored.id,
			sha256(session)
		);
		db.exec('COMMIT');
	} catch (error) {
		if (db.isTransaction) db.exec('ROLLBACK');
		throw error;
	}
	return undefined;
}

function createSession(db: DatabaseSync, userId: number, now: Date): string {
	const token = randomBytes(32).toString('base64url');
	const expiresAt = new Date(now.getTime() + SESSION_HOURS * 3_600_000).toISOString();
	db.prepare('INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)').run(
		sha256(token),
		userId,
		expiresAt
	);
	return token;
}

/** The user of a session that has not expired; undefined for none. */
export function sessionUser(
	db: DatabaseSync,
	token: string | undefined,
	now = new Date()
): SessionUser | undefined {
	if (!token) return undefined;
	const row = db
		.prepare(
			`SELECT users.id, users.username,
				(SELECT json_group_array(role) FROM user_roles WHERE user_id = users.id) AS roles
			FROM sessions JOIN users ON users.id = sessions.user_id
			WHERE sessions.token_hash = ? AND sessions.expires_at > ?`
		)
		.get(sha256(token), now.toISOString()) as
		{ id: number; username: string; roles: string } | undefined;
	return row && { id: row.id, username: row.username, roles: JSON.parse(row.roles) as Role[] };
}

export function deleteSession(db: DatabaseSync, token: string) {
	db.prepare('DELETE FROM sessions WHERE token_hash = ?').run(sha256(token));
}

/**
 * Deletes a user with the role `admin` and their sessions, but only when `username` names one, so
 * a reset needs to know whose account it removes. Returns whether it did. Without another admin,
 * the management area offers the setup again.
 */
export function resetAdmin(db: DatabaseSync, username: string): boolean {
	const admin = db
		.prepare(
			`SELECT users.id FROM users JOIN user_roles ON user_roles.user_id = users.id
			WHERE users.username = ? AND user_roles.role = 'admin'`
		)
		.get(username.trim()) as { id: number } | undefined;
	if (!admin) return false;
	db.exec('BEGIN IMMEDIATE');
	try {
		// Deleted one by one: the reset script opens the file without enforcing foreign keys.
		for (const table of ['sessions', 'user_roles']) {
			db.prepare(`DELETE FROM ${table} WHERE user_id = ?`).run(admin.id);
		}
		db.prepare('DELETE FROM users WHERE id = ?').run(admin.id);
		db.exec('COMMIT');
	} catch (error) {
		if (db.isTransaction) db.exec('ROLLBACK');
		throw error;
	}
	return true;
}

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
 * `/manage/projects/[id]`), never the raw request path, whose percent-escapes the router decodes.
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
	if (pathname === '/login') return user && mayOpen(user, '/manage') ? '/manage' : undefined;
	if (!user) return '/login';
	return mayOpen(user, pathname) ? undefined : 'forbidden';
}
