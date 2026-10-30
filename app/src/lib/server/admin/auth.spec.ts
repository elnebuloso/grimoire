import { describe, it, expect, beforeEach, vi } from 'vitest';
import { spawnSync } from 'node:child_process';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { DatabaseSync } from 'node:sqlite';
import { openDatabase } from '../db/schema';

type Auth = typeof import('./auth');

let auth: Auth;
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
	db = openDatabase(':memory:');
});

function loggedToken(): string {
	auth.checkAdminAccount(db);
	const line = logged().findLast((message) => message.includes('setup token'))!;
	return line.split(' ').at(-1)!;
}

async function setUp(username = 'admin') {
	expect(
		await auth.setupAdmin(db, { token: loggedToken(), username, password: PASSWORD })
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
			await auth.setupAdmin(db, { token: 'guess', username: 'admin', password: PASSWORD })
		).toBe('wrong-setup-token');
		expect(auth.checkAdminAccount(db)).toBe(false);
	});

	it('rejects a short password and an empty username', async () => {
		const token = loggedToken();

		expect(await auth.setupAdmin(db, { token, username: 'admin', password: 'short' })).toBe(
			'password-too-short'
		);
		expect(await auth.setupAdmin(db, { token, username: ' ', password: PASSWORD })).toBe(
			'username-missing'
		);
	});

	it('stores only a scrypt hash and cannot run twice', async () => {
		const token = loggedToken();
		await setUp();

		const stored = db.prepare('SELECT password_hash FROM users').get() as { password_hash: string };
		expect(stored.password_hash).not.toContain(PASSWORD);
		expect(await auth.setupAdmin(db, { token, username: 'other', password: PASSWORD })).toBe(
			'admin-exists'
		);
	});
});

describe('login', () => {
	beforeEach(() => setUp());

	it('creates a session for the right credentials', async () => {
		const session = sessionOf(
			await auth.login(db, 'client', { username: 'admin', password: PASSWORD }, NOW)
		);

		expect(auth.sessionUser(db, session, NOW)).toEqual({
			id: 1,
			username: 'admin',
			roles: ['admin']
		});
	});

	it('rejects a wrong password or username alike', async () => {
		const wrongPassword = await auth.login(
			db,
			'client',
			{ username: 'admin', password: 'nope' },
			NOW
		);
		const wrongUser = await auth.login(db, 'client', { username: 'root', password: PASSWORD }, NOW);

		expect(wrongPassword).toEqual({ error: 'wrong-credentials' });
		expect(wrongUser).toEqual(wrongPassword);
	});

	it('blocks a client for 15 minutes after 10 failures, others stay free', async () => {
		for (let attempt = 0; attempt < 10; attempt++) {
			await auth.login(db, 'attacker', { username: 'admin', password: 'nope' }, NOW);
		}
		const later = new Date(NOW.getTime() + 14 * 60_000);
		const afterBlock = new Date(NOW.getTime() + 15 * 60_000 + 1);

		expect(
			await auth.login(db, 'attacker', { username: 'admin', password: PASSWORD }, later)
		).toEqual({
			error: 'blocked'
		});
		expect(
			'session' in
				(await auth.login(db, 'admin-pc', { username: 'admin', password: PASSWORD }, later))
		).toBe(true);
		expect(
			'session' in
				(await auth.login(db, 'attacker', { username: 'admin', password: PASSWORD }, afterBlock))
		).toBe(true);
	});

	it('blocks a client that sends its attempts in parallel just as well', async () => {
		const attempts = Array.from({ length: 12 }, () =>
			auth.login(db, 'attacker', { username: 'admin', password: 'nope' }, NOW)
		);

		const results = await Promise.all(attempts);

		expect(
			results.filter((result) => 'error' in result && result.error === 'blocked')
		).toHaveLength(2);
	});

	it('counts failures from zero again after 15 quiet minutes', async () => {
		const fail = (at: Date) => auth.login(db, 'typo', { username: 'admin', password: 'nope' }, at);
		for (let attempt = 0; attempt < 9; attempt++) await fail(NOW);
		const quiet = new Date(NOW.getTime() + 15 * 60_000);

		for (let attempt = 0; attempt < 9; attempt++) await fail(quiet);

		expect(await fail(quiet)).toEqual({ error: 'wrong-credentials' });
		expect(await fail(quiet)).toEqual({ error: 'blocked' });
	});

	it('deletes expired sessions when a new one starts', async () => {
		await auth.login(db, 'client', { username: 'admin', password: PASSWORD }, NOW);
		const later = new Date(NOW.getTime() + 12 * 3_600_000);

		await auth.login(db, 'client', { username: 'admin', password: PASSWORD }, later);

		expect(db.prepare('SELECT COUNT(*) AS n FROM sessions').get()).toEqual({ n: 1 });
	});

	it('ends a session after 12 hours or on logout', async () => {
		const first = sessionOf(
			await auth.login(db, 'client', { username: 'admin', password: PASSWORD }, NOW)
		);
		const second = sessionOf(
			await auth.login(db, 'client', { username: 'admin', password: PASSWORD }, NOW)
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
		await auth.createUser(db, { username: 'editor', password: EDITOR_PASSWORD, roles: [] });
	});

	it('logs each user in with their own password and roles', async () => {
		const admin = sessionOf(
			await auth.login(db, 'a', { username: 'admin', password: PASSWORD }, NOW)
		);
		const editor = sessionOf(
			await auth.login(db, 'b', { username: 'editor', password: EDITOR_PASSWORD }, NOW)
		);

		expect(auth.sessionUser(db, admin, NOW)).toMatchObject({ username: 'admin', roles: ['admin'] });
		expect(auth.sessionUser(db, editor, NOW)).toMatchObject({ username: 'editor', roles: [] });
		expect(await auth.login(db, 'b', { username: 'editor', password: PASSWORD }, NOW)).toEqual({
			error: 'wrong-credentials'
		});
	});

	it('refuses a second user with the same username', async () => {
		await expect(
			auth.createUser(db, { username: 'editor', password: PASSWORD, roles: ['admin'] })
		).rejects.toThrow(/UNIQUE/);
	});

	it('changes the password and ends the other sessions of the one user only', async () => {
		const admin = sessionOf(
			await auth.login(db, 'a', { username: 'admin', password: PASSWORD }, NOW)
		);
		const editor = sessionOf(
			await auth.login(db, 'b', { username: 'editor', password: EDITOR_PASSWORD }, NOW)
		);
		const editorElsewhere = sessionOf(
			await auth.login(db, 'c', { username: 'editor', password: EDITOR_PASSWORD }, NOW)
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
			'session' in (await auth.login(db, 'a', { username: 'admin', password: PASSWORD }, NOW))
		).toBe(true);
	});

	it('keeps a user without the role admin out of the management area, but lets them log out or in', async () => {
		const editor = sessionOf(
			await auth.login(db, 'b', { username: 'editor', password: EDITOR_PASSWORD })
		);

		expect(auth.accessRedirect(db, '/manage', editor)).toBe('forbidden');
		expect(auth.accessRedirect(db, '/manage/projects/1', editor)).toBe('forbidden');
		expect(auth.accessRedirect(db, '/logout', editor)).toBeUndefined();
		expect(auth.accessRedirect(db, '/login', editor)).toBeUndefined();
		expect(auth.accessRedirect(db, '/account', editor)).toBeUndefined();
	});

	it('sends each user home to what they may open', async () => {
		const admin = auth.sessionUser(
			db,
			sessionOf(await auth.login(db, 'a', { username: 'admin', password: PASSWORD }))
		)!;
		const editor = auth.sessionUser(
			db,
			sessionOf(await auth.login(db, 'b', { username: 'editor', password: EDITOR_PASSWORD }))
		)!;

		expect([auth.homeOf(admin), auth.homeOf(editor)]).toEqual(['/manage', '/']);
		expect([auth.mayOpen(editor, '/manage/api-keys'), auth.mayOpen(editor, '/account')]).toEqual([
			false,
			true
		]);
	});

	it('offers the setup again while no user has the role admin, even with other users', async () => {
		expect(auth.resetAdmin(db, 'editor')).toBe(false);
		expect(auth.resetAdmin(db, 'admin')).toBe(true);

		expect(auth.checkAdminAccount(db)).toBe(false);
		expect(auth.accessRedirect(db, '/manage', undefined)).toBe('/setup');
		await setUp('new-admin');
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
			await auth.login(db, 'laptop', { username: 'admin', password: PASSWORD }, NOW)
		);
		other = sessionOf(
			await auth.login(db, 'phone', { username: 'admin', password: PASSWORD }, NOW)
		);
	});

	function login(password: string) {
		return auth.login(db, 'check', { username: 'admin', password }, NOW);
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
			).toBe('wrong-current-password');
		}
		await auth.login(db, 'laptop', { username: 'admin', password: 'nope' }, NOW);

		expect(await auth.login(db, 'laptop', { username: 'admin', password: PASSWORD }, NOW)).toEqual({
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
		).toBe('blocked');
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
		).toBe('new-password-too-short');
		expect('session' in (await login(PASSWORD))).toBe(true);
		expect(auth.sessionUser(db, other, NOW)).toBeDefined();
	});
});

describe('accessRedirect', () => {
	it('sends everything to the setup while there is no admin', async () => {
		expect(auth.accessRedirect(db, '/manage', undefined)).toBe('/setup');
		expect(auth.accessRedirect(db, '/login', undefined)).toBe('/setup');
		expect(auth.accessRedirect(db, '/account', undefined)).toBe('/setup');
		expect(auth.accessRedirect(db, '/setup', undefined)).toBeUndefined();
	});

	it('hides the setup once done and requires a session for everything but the login', async () => {
		await setUp();
		const session = sessionOf(
			await auth.login(db, 'client', { username: 'admin', password: PASSWORD })
		);

		expect(auth.accessRedirect(db, '/setup', session)).toBe('not-found');
		expect(auth.accessRedirect(db, '/manage', undefined)).toBe('/login');
		expect(auth.accessRedirect(db, '/logout', 'forged')).toBe('/login');
		expect(auth.accessRedirect(db, '/account', undefined)).toBe('/login');
		expect(auth.accessRedirect(db, '/login', undefined)).toBeUndefined();
		expect(auth.accessRedirect(db, '/manage', session)).toBeUndefined();
		expect(auth.accessRedirect(db, '/login', session)).toBe('/manage');
	});
});

describe('pages outside the account and management pages', () => {
	it('are served whatever the state, even before the setup', async () => {
		for (const path of ['/', '/projects', '/p/platform/query', '/manage-tools', '/accounting']) {
			expect(auth.accessRedirect(db, path, undefined)).toBeUndefined();
		}
	});
});

describe('resetAdmin', () => {
	beforeEach(() => setUp());

	it('changes nothing unless the admin username is confirmed', async () => {
		expect(auth.resetAdmin(db, 'root')).toBe(false);
		expect(auth.checkAdminAccount(db)).toBe(true);
	});

	it('deletes the account and its sessions; the server reports it and offers a new setup', async () => {
		const session = sessionOf(
			await auth.login(db, 'client', { username: 'admin', password: PASSWORD })
		);
		const firstToken = logged().find((message) => message.includes('setup token'));
		auth.checkAdminAccount(db);

		expect(auth.resetAdmin(db, ' admin ')).toBe(true);
		expect(auth.sessionUser(db, session)).toBeUndefined();
		expect(auth.accessRedirect(db, '/manage', session)).toBe('/setup');
		expect(logged()).toContain('Admin account was reset.');
		expect(loggedToken()).not.toBe(firstToken?.split(' ').at(-1));
		await setUp('new-admin');
	});
});

describe('scripts/reset-admin.ts', () => {
	it('refuses to run without a terminal and leaves the admin in place', async () => {
		await setUp();
		const path = join(mkdtempSync(join(tmpdir(), 'grimoire-reset-')), 'grimoire.db');
		const fileDb = openDatabase(path);
		fileDb.exec("INSERT INTO users (id, username, password_hash) VALUES (1, 'admin', 'x')");
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
		expect(check.prepare('SELECT username FROM users').get()).toEqual({ username: 'admin' });
		check.close();
	});
});
