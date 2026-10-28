import { createHash, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import type { DatabaseSync } from 'node:sqlite';

export const SESSION_COOKIE = 'grimoire_session';
// Only the admin area reads the session, and no other site may send it along.
export const sessionCookieOptions = { path: '/admin', httpOnly: true, sameSite: 'strict' } as const;

const MIN_PASSWORD_LENGTH = 12;
const SESSION_HOURS = 12;
const MAX_FAILED_LOGINS = 10;
const BLOCK_MINUTES = 15;

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

function hashPassword(password: string): string {
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

function findAdmin(db: DatabaseSync) {
	return db.prepare('SELECT username, password_hash FROM admin WHERE id = 1').get() as
		{ username: string; password_hash: string } | undefined;
}

/**
 * Whether the admin account exists. While it does not, a setup token is created and written to
 * the log once; an account that disappears while the server runs is reported as a reset.
 */
export function checkAdminAccount(db: DatabaseSync): boolean {
	if (findAdmin(db)) {
		adminSeen = true;
		setupTokenValue = undefined;
		return true;
	}
	if (adminSeen) {
		adminSeen = false;
		console.warn('Admin account was reset.');
	}
	if (!setupTokenValue) {
		setupTokenValue = randomBytes(24).toString('base64url');
		console.warn(
			`No admin account yet. Set it up at /admin/setup with the setup token ${setupTokenValue}`
		);
	}
	return false;
}

/** Creates the admin account; returns a message for the form when it cannot. */
export function setupAdmin(
	db: DatabaseSync,
	form: { token: string; username: string; password: string }
): string | undefined {
	if (checkAdminAccount(db)) return 'The admin account already exists.';
	if (!setupTokenValue || !sameText(form.token, setupTokenValue)) {
		return 'Wrong setup token. It is in the server log.';
	}
	if (!form.username.trim()) return 'Enter a username.';
	if (form.password.length < MIN_PASSWORD_LENGTH) {
		return `The password needs at least ${MIN_PASSWORD_LENGTH} characters.`;
	}
	db.prepare('INSERT INTO admin (id, username, password_hash) VALUES (1, ?, ?)').run(
		form.username.trim(),
		hashPassword(form.password)
	);
	checkAdminAccount(db);
	return undefined;
}

/**
 * Checks the credentials of one client. Returns a new session token, or a message for the form;
 * a client is blocked for a while after too many failures.
 */
export function login(
	db: DatabaseSync,
	client: string,
	form: { username: string; password: string },
	now = new Date()
): { session: string } | { error: string } {
	const failures = failedLogins.get(client);
	if (failures && failures.blockedUntil > now.getTime()) {
		return { error: 'Too many failed logins. Try again later.' };
	}
	const admin = findAdmin(db);
	// The password is checked even for a wrong username, so the answer time does not tell which.
	const valid =
		admin !== undefined &&
		passwordMatches(form.password, admin.password_hash) &&
		sameText(form.username, admin.username);
	if (!valid) {
		const count = (failures?.count ?? 0) + 1;
		failedLogins.set(client, {
			count: count >= MAX_FAILED_LOGINS ? 0 : count,
			blockedUntil: count >= MAX_FAILED_LOGINS ? now.getTime() + BLOCK_MINUTES * 60_000 : 0
		});
		return { error: 'Wrong username or password.' };
	}
	failedLogins.delete(client);
	return { session: createSession(db, now) };
}

function createSession(db: DatabaseSync, now: Date): string {
	const token = randomBytes(32).toString('base64url');
	const expiresAt = new Date(now.getTime() + SESSION_HOURS * 3_600_000).toISOString();
	db.prepare('INSERT INTO admin_sessions (token_hash, expires_at) VALUES (?, ?)').run(
		sha256(token),
		expiresAt
	);
	return token;
}

/** Whether the token belongs to a session that has not expired. */
export function sessionValid(
	db: DatabaseSync,
	token: string | undefined,
	now = new Date()
): boolean {
	if (!token) return false;
	return (
		db
			.prepare('SELECT 1 FROM admin_sessions WHERE token_hash = ? AND expires_at > ?')
			.get(sha256(token), now.toISOString()) !== undefined
	);
}

export function deleteSession(db: DatabaseSync, token: string) {
	db.prepare('DELETE FROM admin_sessions WHERE token_hash = ?').run(sha256(token));
}

/**
 * Deletes the admin account and all sessions, but only when `username` names the current admin,
 * so a reset needs to know whose account it removes. Returns whether it did.
 */
export function resetAdmin(db: DatabaseSync, username: string): boolean {
	const admin = findAdmin(db);
	if (!admin || admin.username !== username.trim()) return false;
	db.exec('BEGIN IMMEDIATE');
	try {
		db.exec('DELETE FROM admin_sessions; DELETE FROM admin;');
		db.exec('COMMIT');
	} catch (error) {
		if (db.isTransaction) db.exec('ROLLBACK');
		throw error;
	}
	return true;
}

/**
 * Where a request for an admin path must go instead: the setup while there is no admin, the
 * login without a valid session, `'not-found'` for the setup once it is done; undefined to serve it.
 */
export function adminAccessRedirect(
	db: DatabaseSync,
	pathname: string,
	session: string | undefined
): string | 'not-found' | undefined {
	if (!checkAdminAccount(db)) return pathname === '/admin/setup' ? undefined : '/admin/setup';
	if (pathname === '/admin/setup') return 'not-found';
	const loggedIn = sessionValid(db, session);
	if (pathname === '/admin/login') return loggedIn ? '/admin' : undefined;
	return loggedIn ? undefined : '/admin/login';
}
