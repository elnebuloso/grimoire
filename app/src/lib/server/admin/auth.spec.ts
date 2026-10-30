import { describe, it, expect, beforeEach, vi } from 'vitest';
import { spawnSync } from 'node:child_process';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { DatabaseSync } from 'node:sqlite';
import { openDatabase } from '../db/schema';

type Auth = typeof import('./auth');

let auth: Auth;
let access: typeof import('./access');
let db: DatabaseSync;
let logged: () => string[];

const PASSWORD = 'correct horse battery';
const NOW = new Date('2026-10-28T12:00:00Z');

// The setup token, failed logins and whether an admin was seen live in module state, so every
// test gets a fresh module.
beforeEach(async () => {
	vi.resetModules();
	// The fresh auth module logs through the fresh log module.
	const { captureLog } = await import('../capture-log');
	logged = captureLog().messages;
	auth = await import('./auth');
	access = await import('./access');
	db = openDatabase(':memory:');
});

function loggedToken(): string {
	auth.checkAdminAccount(db);
	const line = logged().findLast((message) => message.includes('setup token'))!;
	return line.split(' ').at(-1)!;
}

async function setUp(email = 'admin@example.com') {
	expect(
		await auth.setupAdmin(db, { token: loggedToken(), email, password: PASSWORD })
	).toBeUndefined();
}

function sessionOf(result: { session: string } | { error: string }): string {
	if (!('session' in result)) throw new Error(result.error);
	return result.session;
}

describe('setup', () => {
	it('logs a setup token once while there is no admin', async () => {
		auth.checkAdminAccount(db);
		auth.checkAdminAccount(db);

		expect(logged().filter((message) => message.includes('setup token'))).toHaveLength(1);
	});

	it('needs the setup token from the log', async () => {
		loggedToken();

		expect(
			await auth.setupAdmin(db, { token: 'guess', email: 'admin@example.com', password: PASSWORD })
		).toEqual({ error: 'wrong-setup-token' });
		expect(auth.checkAdminAccount(db)).toBe(false);
	});

	it('rejects a short password and anything that is not an email address', async () => {
		const token = loggedToken();

		expect(
			await auth.setupAdmin(db, { token, email: 'admin@example.com', password: 'short' })
		).toEqual({ error: 'password-too-short' });
		for (const email of [' ', 'admin', 'admin@', 'admin@example', 'ad min@example.com']) {
			expect(await auth.setupAdmin(db, { token, email, password: PASSWORD })).toEqual({
				error: 'email-invalid'
			});
		}
	});

	it('stores only a scrypt hash and cannot run twice', async () => {
		const token = loggedToken();
		await setUp();

		const stored = db.prepare('SELECT password_hash FROM users').get() as { password_hash: string };
		expect(stored.password_hash).not.toContain(PASSWORD);
		expect(
			await auth.setupAdmin(db, { token, email: 'other@example.com', password: PASSWORD })
		).toEqual({ error: 'admin-exists' });
	});
});

describe('setupAdmin submitted twice at once', () => {
	it.each([
		['the same address', 'admin@example.com'],
		['another address', 'other@example.com']
	])('creates one admin and answers the other submit with %s admin-exists', async (_, email) => {
		const token = loggedToken();

		// The two password hashes run in parallel; either submit may finish first.
		const results = await Promise.all([
			auth.setupAdmin(db, { token, email: 'admin@example.com', password: PASSWORD }),
			auth.setupAdmin(db, { token, email, password: PASSWORD })
		]);

		expect(results).toContainEqual({ error: 'admin-exists' });
		expect(results).toContainEqual(undefined);
		const winner = results[0] === undefined ? 'admin@example.com' : email;
		expect(db.prepare('SELECT email FROM users').all()).toEqual([{ email: winner }]);
	});
});

describe('login', () => {
	beforeEach(() => setUp());

	it('creates a session for the right credentials', async () => {
		const session = sessionOf(
			await auth.login(db, 'client', { email: 'admin@example.com', password: PASSWORD }, NOW)
		);

		expect(auth.sessionUser(db, session, NOW)).toEqual({
			id: 1,
			email: 'admin@example.com',
			roles: ['admin']
		});
	});

	it('accepts the email address in any letter case and with surrounding spaces', async () => {
		const result = await auth.login(
			db,
			'client',
			{ email: ' ADMIN@example.COM ', password: PASSWORD },
			NOW
		);

		expect(auth.sessionUser(db, sessionOf(result), NOW)).toMatchObject({
			email: 'admin@example.com'
		});
	});

	it('rejects a wrong password or email address alike', async () => {
		const wrongPassword = await auth.login(
			db,
			'client',
			{ email: 'admin@example.com', password: 'nope' },
			NOW
		);
		const wrongUser = await auth.login(
			db,
			'client',
			{ email: 'root@example.com', password: PASSWORD },
			NOW
		);

		expect(wrongPassword).toEqual({ error: 'wrong-credentials' });
		expect(wrongUser).toEqual(wrongPassword);
	});

	it('blocks a client for 15 minutes after 10 failures, others stay free', async () => {
		for (let attempt = 0; attempt < 10; attempt++) {
			await auth.login(db, 'attacker', { email: 'admin@example.com', password: 'nope' }, NOW);
		}
		const later = new Date(NOW.getTime() + 14 * 60_000);
		const afterBlock = new Date(NOW.getTime() + 15 * 60_000 + 1);

		expect(
			await auth.login(db, 'attacker', { email: 'admin@example.com', password: PASSWORD }, later)
		).toEqual({
			error: 'blocked'
		});
		expect(
			'session' in
				(await auth.login(
					db,
					'admin-pc',
					{ email: 'admin@example.com', password: PASSWORD },
					later
				))
		).toBe(true);
		expect(
			'session' in
				(await auth.login(
					db,
					'attacker',
					{ email: 'admin@example.com', password: PASSWORD },
					afterBlock
				))
		).toBe(true);
	});

	it('blocks a client that sends its attempts in parallel just as well', async () => {
		const attempts = Array.from({ length: 12 }, () =>
			auth.login(db, 'attacker', { email: 'admin@example.com', password: 'nope' }, NOW)
		);

		const results = await Promise.all(attempts);

		expect(
			results.filter((result) => 'error' in result && result.error === 'blocked')
		).toHaveLength(2);
	});

	it('refuses logins of any client while too many password hashes wait', async () => {
		// Warms the hash compared against for unknown addresses; cheap stored hashes keep this fast.
		await auth.login(db, 'warm-up', { email: 'admin@example.com', password: PASSWORD }, NOW);
		const cheap = await auth.hashPassword(PASSWORD, { N: 2 ** 10, r: 8, p: 1 });
		db.prepare('UPDATE users SET password_hash = ?').run(cheap);

		const results = await Promise.all(
			Array.from({ length: 17 }, (_, client) =>
				auth.login(db, `client-${client}`, { email: 'admin@example.com', password: 'nope' }, NOW)
			)
		);

		expect(results.slice(0, 16)).toEqual(Array(16).fill({ error: 'wrong-credentials' }));
		expect(results[16]).toEqual({ error: 'blocked' });
		expect(
			await auth.login(db, 'client-16', { email: 'admin@example.com', password: PASSWORD }, NOW)
		).toHaveProperty('session');
	});

	it('counts failures from zero again after 15 quiet minutes', async () => {
		const fail = (at: Date) =>
			auth.login(db, 'typo', { email: 'admin@example.com', password: 'nope' }, at);
		for (let attempt = 0; attempt < 9; attempt++) await fail(NOW);
		const quiet = new Date(NOW.getTime() + 15 * 60_000);

		for (let attempt = 0; attempt < 9; attempt++) await fail(quiet);

		expect(await fail(quiet)).toEqual({ error: 'wrong-credentials' });
		expect(await fail(quiet)).toEqual({ error: 'blocked' });
	});

	it('verifies a hash made with other scrypt parameters than the current ones', async () => {
		const cheaper = await auth.hashPassword(PASSWORD, { N: 2 ** 17, r: 4, p: 2 });
		db.prepare("UPDATE users SET password_hash = ? WHERE email = 'admin@example.com'").run(cheaper);

		expect(
			await auth.login(db, 'client', { email: 'admin@example.com', password: PASSWORD }, NOW)
		).toHaveProperty('session');
		expect(
			await auth.login(
				db,
				'client',
				{ email: 'admin@example.com', password: 'wrong horse battery' },
				NOW
			)
		).toEqual({ error: 'wrong-credentials' });
	});

	it('deletes expired sessions when a new one starts', async () => {
		await auth.login(db, 'client', { email: 'admin@example.com', password: PASSWORD }, NOW);
		const later = new Date(NOW.getTime() + 12 * 3_600_000);

		await auth.login(db, 'client', { email: 'admin@example.com', password: PASSWORD }, later);

		expect(db.prepare('SELECT COUNT(*) AS n FROM sessions').get()).toEqual({ n: 1 });
	});

	it('ends a session after 12 hours or on logout', async () => {
		const first = sessionOf(
			await auth.login(db, 'client', { email: 'admin@example.com', password: PASSWORD }, NOW)
		);
		const second = sessionOf(
			await auth.login(db, 'client', { email: 'admin@example.com', password: PASSWORD }, NOW)
		);

		expect(auth.sessionUser(db, first, new Date(NOW.getTime() + 12 * 3_600_000))).toBeUndefined();
		auth.deleteSession(db, second);
		expect(auth.sessionUser(db, second, NOW)).toBeUndefined();
		expect(auth.sessionUser(db, undefined, NOW)).toBeUndefined();
	});
});

describe('several users', () => {
	const EDITOR_PASSWORD = 'editor horse battery';

	beforeEach(async () => {
		await setUp();
		await auth.createUser(db, {
			email: 'editor@example.com',
			password: EDITOR_PASSWORD,
			roles: []
		});
	});

	it('logs each user in with their own password and roles', async () => {
		const admin = sessionOf(
			await auth.login(db, 'a', { email: 'admin@example.com', password: PASSWORD }, NOW)
		);
		const editor = sessionOf(
			await auth.login(db, 'b', { email: 'editor@example.com', password: EDITOR_PASSWORD }, NOW)
		);

		expect(auth.sessionUser(db, admin, NOW)).toMatchObject({
			email: 'admin@example.com',
			roles: ['admin']
		});
		expect(auth.sessionUser(db, editor, NOW)).toMatchObject({
			email: 'editor@example.com',
			roles: []
		});
		expect(
			await auth.login(db, 'b', { email: 'editor@example.com', password: PASSWORD }, NOW)
		).toEqual({
			error: 'wrong-credentials'
		});
	});

	it('refuses a second user with the same email address, whatever its letter case', async () => {
		await expect(
			auth.createUser(db, { email: ' Editor@Example.com', password: PASSWORD, roles: ['admin'] })
		).rejects.toThrow(/UNIQUE/);
	});

	it('changes the password and ends the other sessions of the one user only', async () => {
		const admin = sessionOf(
			await auth.login(db, 'a', { email: 'admin@example.com', password: PASSWORD }, NOW)
		);
		const editor = sessionOf(
			await auth.login(db, 'b', { email: 'editor@example.com', password: EDITOR_PASSWORD }, NOW)
		);
		const editorElsewhere = sessionOf(
			await auth.login(db, 'c', { email: 'editor@example.com', password: EDITOR_PASSWORD }, NOW)
		);

		expect(
			await auth.changePassword(
				db,
				'b',
				editor,
				{ current: EDITOR_PASSWORD, password: 'a new editor pass' },
				NOW
			)
		).toBeUndefined();

		expect(auth.sessionUser(db, editor, NOW)).toBeDefined();
		expect(auth.sessionUser(db, editorElsewhere, NOW)).toBeUndefined();
		expect(auth.sessionUser(db, admin, NOW)).toBeDefined();
		expect(
			'session' in
				(await auth.login(db, 'a', { email: 'admin@example.com', password: PASSWORD }, NOW))
		).toBe(true);
	});

	it('keeps a user without the role admin out of the management area, but lets them log out or in', async () => {
		const editor = sessionOf(
			await auth.login(db, 'b', { email: 'editor@example.com', password: EDITOR_PASSWORD })
		);

		expect(access.accessRedirect(db, '/manage', editor)).toBe('forbidden');
		expect(access.accessRedirect(db, '/manage/sources/1', editor)).toBe('forbidden');
		expect(access.accessRedirect(db, '/logout', editor)).toBeUndefined();
		expect(access.accessRedirect(db, '/login', editor)).toBeUndefined();
		expect(access.accessRedirect(db, '/account', editor)).toBeUndefined();
	});

	it('sends each user home to what they may open', async () => {
		const admin = auth.sessionUser(
			db,
			sessionOf(await auth.login(db, 'a', { email: 'admin@example.com', password: PASSWORD }))
		)!;
		const editor = auth.sessionUser(
			db,
			sessionOf(
				await auth.login(db, 'b', { email: 'editor@example.com', password: EDITOR_PASSWORD })
			)
		)!;

		expect([access.homeOf(admin), access.homeOf(editor)]).toEqual(['/manage', '/']);
		expect([
			access.mayOpen(editor, '/manage/api-keys'),
			access.mayOpen(editor, '/account')
		]).toEqual([false, true]);
	});

	it('offers the setup again while no user has the role admin, even with other users', async () => {
		expect(auth.resetAdmin(db, 'editor@example.com')).toBe(false);
		expect(auth.resetAdmin(db, 'admin@example.com')).toBe(true);

		expect(auth.checkAdminAccount(db)).toBe(false);
		expect(access.accessRedirect(db, '/manage', undefined)).toBe('/setup');
		await setUp('new-admin@example.com');
		expect(auth.checkAdminAccount(db)).toBe(true);
	});
});

describe('changePassword', () => {
	const NEW_PASSWORD = 'staple battery horse';
	let current: string;
	let other: string;

	beforeEach(async () => {
		await setUp();
		current = sessionOf(
			await auth.login(db, 'laptop', { email: 'admin@example.com', password: PASSWORD }, NOW)
		);
		other = sessionOf(
			await auth.login(db, 'phone', { email: 'admin@example.com', password: PASSWORD }, NOW)
		);
	});

	function login(password: string) {
		return auth.login(db, 'check', { email: 'admin@example.com', password }, NOW);
	}

	it('replaces the password and ends every session but the current one', async () => {
		expect(
			await auth.changePassword(
				db,
				'laptop',
				current,
				{ current: PASSWORD, password: NEW_PASSWORD },
				NOW
			)
		).toBeUndefined();

		expect('session' in (await login(NEW_PASSWORD))).toBe(true);
		expect(await login(PASSWORD)).toEqual({ error: 'wrong-credentials' });
		expect(auth.sessionUser(db, current, NOW)).toBeDefined();
		expect(auth.sessionUser(db, other, NOW)).toBeUndefined();
		const stored = db.prepare('SELECT password_hash FROM users').get() as { password_hash: string };
		expect(stored.password_hash).not.toContain(NEW_PASSWORD);
	});

	it('invalidates reset links sent before the change', async () => {
		const reset = await import('./password-reset');
		const link = reset.requestPasswordReset(db, 'mail', 'admin@example.com', NOW);
		if (!link || 'error' in link) throw new Error('no reset link issued');

		await auth.changePassword(
			db,
			'laptop',
			current,
			{ current: PASSWORD, password: NEW_PASSWORD },
			NOW
		);

		expect(reset.resetLinkValid(db, link.token, NOW)).toBe(false);
	});

	it('changes nothing for a wrong current password and counts it as a failed login', async () => {
		for (let attempt = 0; attempt < 9; attempt++) {
			expect(
				await auth.changePassword(
					db,
					'laptop',
					current,
					{ current: 'nope', password: NEW_PASSWORD },
					NOW
				)
			).toEqual({ error: 'wrong-current-password' });
		}
		await auth.login(db, 'laptop', { email: 'admin@example.com', password: 'nope' }, NOW);

		expect(
			await auth.login(db, 'laptop', { email: 'admin@example.com', password: PASSWORD }, NOW)
		).toEqual({
			error: 'blocked'
		});
		expect(
			await auth.changePassword(
				db,
				'laptop',
				current,
				{ current: PASSWORD, password: NEW_PASSWORD },
				NOW
			)
		).toEqual({ error: 'blocked' });
		expect('session' in (await login(PASSWORD))).toBe(true);
		expect(auth.sessionUser(db, other, NOW)).toBeDefined();
	});

	it('rejects a new password shorter than 12 characters', async () => {
		expect(
			await auth.changePassword(
				db,
				'laptop',
				current,
				{ current: PASSWORD, password: 'short pass' },
				NOW
			)
		).toEqual({ error: 'new-password-too-short' });
		expect('session' in (await login(PASSWORD))).toBe(true);
		expect(auth.sessionUser(db, other, NOW)).toBeDefined();
	});
});

describe('accessRedirect', () => {
	it('sends everything to the setup while there is no admin', async () => {
		expect(access.accessRedirect(db, '/manage', undefined)).toBe('/setup');
		expect(access.accessRedirect(db, '/login', undefined)).toBe('/setup');
		expect(access.accessRedirect(db, '/account', undefined)).toBe('/setup');
		expect(access.accessRedirect(db, '/setup', undefined)).toBeUndefined();
	});

	it('hides the setup once done and requires a session for everything but the login', async () => {
		await setUp();
		const session = sessionOf(
			await auth.login(db, 'client', { email: 'admin@example.com', password: PASSWORD })
		);

		expect(access.accessRedirect(db, '/setup', session)).toBe('not-found');
		expect(access.accessRedirect(db, '/manage', undefined)).toBe('/login');
		expect(access.accessRedirect(db, '/logout', 'forged')).toBe('/login');
		expect(access.accessRedirect(db, '/account', undefined)).toBe('/login');
		expect(access.accessRedirect(db, '/login', undefined)).toBeUndefined();
		expect(access.accessRedirect(db, '/manage', session)).toBeUndefined();
		expect(access.accessRedirect(db, '/login', session)).toBe('/manage');
	});

	it('serves the reset of a forgotten password without a session', async () => {
		await setUp();

		for (const page of ['/login/forgot', '/login/reset/[token]']) {
			expect(access.accessRedirect(db, page, undefined)).toBeUndefined();
		}
	});
});

describe('pages outside the account and management pages', () => {
	it('are served whatever the state, even before the setup', async () => {
		for (const path of ['/', '/sources', '/query', '/manage-tools', '/accounting']) {
			expect(access.accessRedirect(db, path, undefined)).toBeUndefined();
		}
	});
});

describe('resetAdmin', () => {
	beforeEach(() => setUp());

	it('changes nothing unless the email address of an admin is confirmed', async () => {
		expect(auth.resetAdmin(db, 'root@example.com')).toBe(false);
		expect(auth.checkAdminAccount(db)).toBe(true);
	});

	it('deletes the account and its sessions; the server reports it and offers a new setup', async () => {
		const session = sessionOf(
			await auth.login(db, 'client', { email: 'admin@example.com', password: PASSWORD })
		);
		const firstToken = logged().find((message) => message.includes('setup token'));
		auth.checkAdminAccount(db);

		expect(auth.resetAdmin(db, ' Admin@Example.com ')).toBe(true);
		expect(auth.sessionUser(db, session)).toBeUndefined();
		expect(access.accessRedirect(db, '/manage', session)).toBe('/setup');
		expect(logged()).toContain('Admin account was reset.');
		expect(loggedToken()).not.toBe(firstToken?.split(' ').at(-1));
		await setUp('new-admin@example.com');
	});
});

describe('scripts/reset-admin.ts', () => {
	it('refuses to run without a terminal and leaves the admin in place', async () => {
		await setUp();
		const path = join(mkdtempSync(join(tmpdir(), 'grimoire-reset-')), 'grimoire.db');
		const fileDb = openDatabase(path);
		fileDb.exec(
			"INSERT INTO users (id, email, password_hash) VALUES (1, 'admin@example.com', 'x')"
		);
		fileDb.exec("INSERT INTO user_roles (user_id, role) VALUES (1, 'admin')");
		fileDb.close();

		const script = join(import.meta.dirname, '../../../../../scripts/reset-admin.ts');
		const result = spawnSync(process.execPath, [script], {
			input: 'admin\n',
			env: { ...process.env, DATABASE_PATH: path },
			encoding: 'utf8'
		});
		const check = openDatabase(path);

		expect(result.status).toBe(1);
		expect(result.stderr).toContain('Run this in a terminal');
		expect(check.prepare('SELECT email FROM users').get()).toEqual({ email: 'admin@example.com' });
		check.close();
	});
});
