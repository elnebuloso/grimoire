import { createHash, randomBytes, scrypt, timingSafeEqual, type ScryptOptions } from 'node:crypto';
import { promisify } from 'node:util';
import type { DatabaseSync } from 'node:sqlite';
// With its extension: the scripts in `scripts/` load this file with plain node.
import { inTransaction } from '../db/transaction.ts';
import { log, logAlways } from '../log.ts';
import { createLimiter } from '../sync/queue.ts';

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
	email: string;
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
	| 'email-invalid'
	| 'password-too-short'
	| 'blocked'
	| 'wrong-credentials'
	| 'wrong-current-password'
	| 'new-password-too-short'
	| 'reset-blocked'
	| 'reset-link-invalid';

// Kept in memory only: it exists solely to prove access to the server log, so it is never stored.
let setupTokenValue: string | undefined;
let adminSeen = false;
// ponytail: failed logins are counted in memory per client and forgotten on restart; enough for
// one instance, a table if grimoire ever runs on several.
const failedLogins = new Map<
	string,
	{ count: number; blockedUntil: number; lastFailedAt: number }
>();

export function sha256(value: string): string {
	return createHash('sha256').update(value).digest('hex');
}

function sameText(a: string, b: string): boolean {
	return timingSafeEqual(Buffer.from(sha256(a)), Buffer.from(sha256(b)));
}

// Asynchronous, so the thread pool hashes while the server keeps answering other requests.
const scryptAsync = promisify(scrypt) as (
	password: string,
	salt: Buffer,
	keyLength: number,
	options: ScryptOptions
) => Promise<Buffer>;

// OWASP's minimum for scrypt. The hash carries its parameters, so raising them later leaves the
// stored hashes verifiable.
const COST = { N: 2 ** 17, r: 8, p: 1 };

// Every hash takes 128 MiB and a thread of the pool that file and DNS calls wait on too (4 by
// default). The failed-login count is per client, so without a limit across clients, logins
// from many addresses would take all of both.
const PARALLEL_HASHES = 2;
// Beyond this many waiting or running hashes a login is refused rather than queued.
const MAX_PENDING_HASHES = 16;
const hashing = createLimiter(PARALLEL_HASHES);
let pendingHashes = 0;

async function scryptWith(password: string, salt: Buffer, keyLength: number, cost: typeof COST) {
	pendingHashes++;
	try {
		// Node refuses more than 32 MiB by default; scrypt needs 128 * N * r bytes.
		const maxmem = 2 * 128 * cost.N * cost.r;
		return await hashing(() => scryptAsync(password, salt, keyLength, { ...cost, maxmem }));
	} finally {
		pendingHashes--;
	}
}

export async function hashPassword(password: string, cost = COST): Promise<string> {
	const salt = randomBytes(16);
	const hash = await scryptWith(password, salt, 64, cost);
	return ['scrypt', cost.N, cost.r, cost.p, salt.toString('base64'), hash.toString('base64')].join(
		'$'
	);
}

async function passwordMatches(password: string, stored: string): Promise<boolean> {
	const [, N, r, p, salt, hash] = stored.split('$');
	const expected = Buffer.from(hash, 'base64');
	const cost = { N: Number(N), r: Number(r), p: Number(p) };
	return timingSafeEqual(
		await scryptWith(password, Buffer.from(salt, 'base64'), expected.length, cost),
		expected
	);
}

// Compared against when an email address is unknown, so a login takes as long as with a known one.
let unknownUserHash: string | undefined;

// Addresses are compared and stored in lowercase: nobody expects their login to depend on it.
export function normalizeEmail(email: string): string {
	return email.trim().toLowerCase();
}

// Only what tells a typo from an address; whether mail arrives there only sending can tell.
function looksLikeEmail(email: string): boolean {
	return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function findUser(db: DatabaseSync, email: string) {
	return db
		.prepare('SELECT id, email, password_hash FROM users WHERE email = ?')
		.get(normalizeEmail(email)) as { id: number; email: string; password_hash: string } | undefined;
}

function adminExists(db: DatabaseSync): boolean {
	return db.prepare("SELECT 1 FROM user_roles WHERE role = 'admin'").get() !== undefined;
}

/** Creates a user with the given roles; the email address must be free. Returns the new id. */
export async function createUser(
	db: DatabaseSync,
	form: { email: string; password: string; roles: Role[] }
): Promise<number> {
	// Hashed before the transaction: other requests share the connection while it is awaited.
	const passwordHash = await hashPassword(form.password);
	return inTransaction(db, () => {
		const { lastInsertRowid } = db
			.prepare('INSERT INTO users (email, password_hash) VALUES (?, ?)')
			.run(normalizeEmail(form.email), passwordHash);
		for (const role of form.roles) {
			db.prepare('INSERT INTO user_roles (user_id, role) VALUES (?, ?)').run(lastInsertRowid, role);
		}
		return Number(lastInsertRowid);
	});
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
export async function setupAdmin(
	db: DatabaseSync,
	form: { token: string; email: string; password: string }
): Promise<{ error: AuthProblem } | undefined> {
	if (checkAdminAccount(db)) return { error: 'admin-exists' };
	if (!setupTokenValue || !sameText(form.token, setupTokenValue))
		return { error: 'wrong-setup-token' };
	if (!looksLikeEmail(normalizeEmail(form.email))) return { error: 'email-invalid' };
	if (form.password.length < MIN_PASSWORD_LENGTH) return { error: 'password-too-short' };
	await createUser(db, { email: form.email, password: form.password, roles: ['admin'] });
	checkAdminAccount(db);
	return undefined;
}

/**
 * Checks the credentials of one client. Returns a new session token, or why not; a client is
 * blocked for a while after too many failures, and every client while too many hashes wait.
 */
export async function login(
	db: DatabaseSync,
	client: string,
	form: { email: string; password: string },
	now = new Date()
): Promise<{ session: string } | { error: AuthProblem }> {
	if (isBlocked(client, now) || pendingHashes >= MAX_PENDING_HASHES) return { error: 'blocked' };
	// Counted before the password is checked: requests sent in parallel would otherwise all pass
	// the block check while their hashes run. A successful login forgets it again.
	recordFailedLogin(client, now);
	const user = findUser(db, form.email);
	// A password is checked even for an unknown address, so the answer time does not tell which.
	unknownUserHash ??= await hashPassword(randomBytes(16).toString('hex'));
	const matches = await passwordMatches(form.password, user?.password_hash ?? unknownUserHash);
	if (!user || !matches) return { error: 'wrong-credentials' };
	failedLogins.delete(client);
	return { session: createSession(db, user.id, now) };
}

function isBlocked(client: string, now: Date): boolean {
	return (failedLogins.get(client)?.blockedUntil ?? 0) > now.getTime();
}

function recordFailedLogin(client: string, now: Date) {
	forgetQuietClients(now);
	const count = (failedLogins.get(client)?.count ?? 0) + 1;
	failedLogins.set(client, {
		count: count >= MAX_FAILED_LOGINS ? 0 : count,
		blockedUntil: count >= MAX_FAILED_LOGINS ? now.getTime() + BLOCK_MINUTES * 60_000 : 0,
		lastFailedAt: now.getTime()
	});
}

// Without this, every client that ever mistyped a password would stay in memory until a restart.
// A client without a failure for as long as a block lasts starts counting from zero again.
function forgetQuietClients(now: Date) {
	const quietSince = now.getTime() - BLOCK_MINUTES * 60_000;
	for (const [client, entry] of failedLogins) {
		if (entry.blockedUntil <= now.getTime() && entry.lastFailedAt <= quietSince) {
			failedLogins.delete(client);
		}
	}
}

/**
 * Replaces the password of the user of `session` and ends every other session of that user.
 * A wrong current password counts as a failed login of `client`. Returns why when nothing was
 * changed.
 */
export async function changePassword(
	db: DatabaseSync,
	client: string,
	session: string,
	form: { current: string; password: string },
	now = new Date()
): Promise<{ error: AuthProblem } | undefined> {
	if (isBlocked(client, now) || pendingHashes >= MAX_PENDING_HASHES) return { error: 'blocked' };
	// Counted before the check, for the same reason as in `login`.
	recordFailedLogin(client, now);
	const user = sessionUser(db, session, now);
	const stored = user && findUser(db, user.email);
	if (!stored || !(await passwordMatches(form.current, stored.password_hash))) {
		return { error: 'wrong-current-password' };
	}
	failedLogins.delete(client);
	if (form.password.length < MIN_PASSWORD_LENGTH) return { error: 'new-password-too-short' };
	const passwordHash = await hashPassword(form.password);
	inTransaction(db, () => {
		db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(passwordHash, stored.id);
		db.prepare('DELETE FROM sessions WHERE user_id = ? AND token_hash != ?').run(
			stored.id,
			sha256(session)
		);
		// A reset mail the user did not ask for is a reason to change the password; its link must
		// not outlive the change.
		db.prepare('DELETE FROM password_resets WHERE user_id = ?').run(stored.id);
	});
	return undefined;
}

function createSession(db: DatabaseSync, userId: number, now: Date): string {
	// Expired sessions are useless; removed here, they cannot pile up over the life of an instance.
	db.prepare('DELETE FROM sessions WHERE expires_at <= ?').run(now.toISOString());
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
			`SELECT users.id, users.email,
				(SELECT json_group_array(role) FROM user_roles WHERE user_id = users.id) AS roles
			FROM sessions JOIN users ON users.id = sessions.user_id
			WHERE sessions.token_hash = ? AND sessions.expires_at > ?`
		)
		.get(sha256(token), now.toISOString()) as
		{ id: number; email: string; roles: string } | undefined;
	return row && { id: row.id, email: row.email, roles: JSON.parse(row.roles) as Role[] };
}

export function deleteSession(db: DatabaseSync, token: string) {
	db.prepare('DELETE FROM sessions WHERE token_hash = ?').run(sha256(token));
}

/**
 * Deletes a user with the role `admin` and their sessions, but only when `email` names one, so
 * a reset needs to know whose account it removes. Returns whether it did. Without another admin,
 * the management area offers the setup again.
 */
export function resetAdmin(db: DatabaseSync, email: string): boolean {
	const admin = db
		.prepare(
			`SELECT users.id FROM users JOIN user_roles ON user_roles.user_id = users.id
			WHERE users.email = ? AND user_roles.role = 'admin'`
		)
		.get(normalizeEmail(email)) as { id: number } | undefined;
	if (!admin) return false;
	inTransaction(db, () => {
		// Deleted one by one: the reset script opens the file without enforcing foreign keys.
		for (const table of ['sessions', 'user_roles', 'password_resets']) {
			db.prepare(`DELETE FROM ${table} WHERE user_id = ?`).run(admin.id);
		}
		db.prepare('DELETE FROM users WHERE id = ?').run(admin.id);
	});
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
	// The login and the reset of a forgotten password below it need no session.
	if (isUnder(pathname, '/login')) return user && mayOpen(user, '/manage') ? '/manage' : undefined;
	if (!user) return '/login';
	return mayOpen(user, pathname) ? undefined : 'forbidden';
}
