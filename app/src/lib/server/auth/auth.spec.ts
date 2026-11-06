import { describe, it, expect, beforeAll, beforeEach, vi } from 'vitest';
import { spawnSync } from 'node:child_process';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { DatabaseSync } from 'node:sqlite';
import { openDatabase } from '../db/schema';
import { createUser } from './test-user';

type Auth = typeof import('./auth');

let auth: Auth;
let access: typeof import('./access');
let db: DatabaseSync;
let logged: () => string[];

// Every attempt limit the fresh auth module creates, to see how many keys they keep.
const limits = vi.hoisted(() => [] as { size: number }[]);
vi.mock('./attempt-limit', async (original) => {
	const real = await original<typeof import('./attempt-limit')>();
	return {
		...real,
		createAttemptLimit: (...args: Parameters<typeof real.createAttemptLimit>) => {
			const limit = real.createAttemptLimit(...args);
			limits.push(limit);
			return limit;
		}
	};
});

const PASSWORD = 'correct horse battery';
const NOW = new Date('2026-10-28T12:00:00Z');

// The first import of a module transforms it, which on a busy machine took seconds, past the
// timeout of a hook or test; imports after `vi.resetModules` reuse the transform and take
// milliseconds.
beforeAll(async () => {
	await Promise.all([
		import('../capture-log'),
		import('./auth'),
		import('./access'),
		import('./password-reset')
	]);
}, 60_000);

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

function minutesAfterNow(minutes: number): Date {
	return new Date(NOW.getTime() + minutes * 60_000);
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

describe('setup after a reopen', () => {
	it('refuses an address that has an account already', async () => {
		db.exec("INSERT INTO users (email) VALUES ('writer@example.com')");

		expect(
			await auth.setupAdmin(db, {
				token: loggedToken(),
				email: 'Writer@example.com',
				password: PASSWORD
			})
		).toEqual({ error: 'account-exists' });
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

	it('keeps the failures of a client for an account when it logs in to another one', async () => {
		await createUser(db, { email: 'editor@example.com', password: PASSWORD, roles: [] });
		const fail = () =>
			auth.login(db, 'attacker', { email: 'admin@example.com', password: 'nope' }, NOW);
		for (let attempt = 0; attempt < 4; attempt++) await fail();
		const own = await auth.login(
			db,
			'attacker',
			{ email: 'editor@example.com', password: PASSWORD },
			NOW
		);
		expect('session' in own).toBe(true);
		expect(await fail()).toEqual({ error: 'wrong-credentials' });

		expect(await fail()).toEqual({ error: 'blocked' });
	});

	it('keeps the failures of a client for an account when it confirms its current password', async () => {
		await createUser(db, { email: 'editor@example.com', password: PASSWORD, roles: [] });
		const own = await auth.login(
			db,
			'editor-pc',
			{ email: 'editor@example.com', password: PASSWORD },
			NOW
		);
		if (!('session' in own)) throw new Error(own.error);
		const fail = () =>
			auth.login(db, 'attacker', { email: 'admin@example.com', password: 'nope' }, NOW);
		for (let attempt = 0; attempt < 4; attempt++) await fail();
		const confirmed = await auth.checkCurrentPassword(db, 'attacker', own.session, PASSWORD, NOW);
		expect('userId' in confirmed).toBe(true);
		expect(await fail()).toEqual({ error: 'wrong-credentials' });

		expect(await fail()).toEqual({ error: 'blocked' });
	});

	it('blocks an account for a client for 15 minutes after 5 failures, others stay free', async () => {
		await createUser(db, { email: 'editor@example.com', password: PASSWORD, roles: [] });
		for (let attempt = 0; attempt < 5; attempt++) {
			await auth.login(db, 'office', { email: 'admin@example.com', password: 'nope' }, NOW);
		}
		const later = new Date(NOW.getTime() + 14 * 60_000);
		const afterBlock = new Date(NOW.getTime() + 15 * 60_000 + 1);
		const logsIn = async (client: string, email: string, at: Date) =>
			'session' in (await auth.login(db, client, { email, password: PASSWORD }, at));

		expect(
			await auth.login(db, 'office', { email: 'admin@example.com', password: PASSWORD }, later)
		).toEqual({ error: 'blocked' });
		expect(await logsIn('office', 'editor@example.com', later)).toBe(true);
		expect(await logsIn('admin-pc', 'admin@example.com', later)).toBe(true);
		expect(await logsIn('office', 'admin@example.com', afterBlock)).toBe(true);
	});

	it('blocks a client for 15 minutes after 50 failures across accounts', async () => {
		for (let attempt = 0; attempt < 50; attempt++) {
			await auth.login(
				db,
				'office',
				{ email: `typo${attempt}@example.com`, password: 'nope' },
				NOW
			);
		}

		expect(
			await auth.login(db, 'office', { email: 'admin@example.com', password: PASSWORD }, NOW)
		).toEqual({ error: 'blocked' });
		expect(
			await auth.login(db, 'admin-pc', { email: 'admin@example.com', password: PASSWORD }, NOW)
		).toHaveProperty('session');
	});

	it('keeps no key for logins the client limit refuses, whatever email they name', async () => {
		limits.length = 0;
		auth = await (vi.resetModules(), import('./auth'));
		for (let attempt = 0; attempt < 50; attempt++) {
			await auth.login(
				db,
				'office',
				{ email: `typo${attempt}@example.com`, password: 'nope' },
				NOW
			);
		}
		const keys = () => limits.reduce((sum, limit) => sum + limit.size, 0);
		const before = keys();

		for (let attempt = 0; attempt < 200; attempt++) {
			const email = `${'x'.repeat(10_000)}${attempt}@example.com`;
			expect(await auth.login(db, 'office', { email, password: 'nope' }, NOW)).toEqual({
				error: 'blocked'
			});
		}

		expect(keys()).toBe(before);
	});

	it('counts emails by their first 320 characters', async () => {
		const prefix = 'x'.repeat(320);
		for (let attempt = 0; attempt < 5; attempt++) {
			await auth.login(db, 'office', { email: `${prefix}${attempt}`, password: 'nope' }, NOW);
		}

		expect(await auth.login(db, 'office', { email: `${prefix}9`, password: 'nope' }, NOW)).toEqual({
			error: 'blocked'
		});
	});

	it('blocks a client that sends its attempts in parallel just as well', async () => {
		const attempts = Array.from({ length: 12 }, () =>
			auth.login(db, 'attacker', { email: 'admin@example.com', password: 'nope' }, NOW)
		);

		const results = await Promise.all(attempts);

		expect(
			results.filter((result) => 'error' in result && result.error === 'blocked')
		).toHaveLength(7);
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
		for (let attempt = 0; attempt < 4; attempt++) await fail(NOW);
		const quiet = new Date(NOW.getTime() + 15 * 60_000);

		for (let attempt = 0; attempt < 4; attempt++) await fail(quiet);

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

	it('ends a session after an hour without a request, or on logout', async () => {
		const first = sessionOf(
			await auth.login(db, 'client', { email: 'admin@example.com', password: PASSWORD }, NOW)
		);
		const second = sessionOf(
			await auth.login(db, 'client', { email: 'admin@example.com', password: PASSWORD }, NOW)
		);

		expect(auth.sessionUser(db, first, minutesAfterNow(59))).toBeDefined();
		expect(auth.sessionUser(db, first, minutesAfterNow(60))).toBeUndefined();
		auth.deleteSession(db, second);
		expect(auth.sessionUser(db, second, NOW)).toBeUndefined();
		expect(auth.sessionUser(db, undefined, NOW)).toBeUndefined();
	});

	it('keeps a session in use alive, but not past 12 hours after the login', async () => {
		const session = sessionOf(
			await auth.login(db, 'client', { email: 'admin@example.com', password: PASSWORD }, NOW)
		);

		for (let minutes = 50; minutes < 12 * 60; minutes += 50) {
			auth.touchSession(db, session, minutesAfterNow(minutes));
			expect(auth.sessionUser(db, session, minutesAfterNow(minutes + 1))).toBeDefined();
		}
		expect(auth.sessionUser(db, session, minutesAfterNow(12 * 60 - 1))).toBeDefined();
		expect(auth.sessionUser(db, session, minutesAfterNow(12 * 60))).toBeUndefined();
		auth.touchSession(db, session, minutesAfterNow(12 * 60 + 1));
		expect(auth.sessionUser(db, session, minutesAfterNow(12 * 60 + 2))).toBeUndefined();
	});

	it('writes the new idle end at most once a minute and never revives an ended session', async () => {
		const session = sessionOf(
			await auth.login(db, 'client', { email: 'admin@example.com', password: PASSWORD }, NOW)
		);
		const idleEnd = () =>
			(db.prepare('SELECT expires_at FROM sessions').get() as { expires_at: string }).expires_at;

		auth.touchSession(db, session, new Date(NOW.getTime() + 59_000));
		expect(idleEnd()).toBe(minutesAfterNow(60).toISOString());
		auth.touchSession(db, session, minutesAfterNow(2));
		expect(idleEnd()).toBe(minutesAfterNow(62).toISOString());
		auth.touchSession(db, session, minutesAfterNow(70));
		expect(idleEnd()).toBe(minutesAfterNow(62).toISOString());
	});
});

describe('several users', () => {
	const EDITOR_PASSWORD = 'editor horse battery';

	beforeEach(async () => {
		await setUp();
		await createUser(db, {
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
			createUser(db, { email: ' Editor@Example.com', password: PASSWORD, roles: ['admin'] })
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

	it('keeps a user without the role admin out of the management area, but not out of their account', async () => {
		const editor = sessionOf(
			await auth.login(db, 'b', { email: 'editor@example.com', password: EDITOR_PASSWORD })
		);

		expect(access.accessRedirect(db, '/manage', auth.sessionUser(db, editor))).toBe('forbidden');
		expect(access.accessRedirect(db, '/manage/sources/[id]', auth.sessionUser(db, editor))).toBe(
			'forbidden'
		);
		expect(access.accessRedirect(db, '/manage/dead-links', auth.sessionUser(db, editor))).toBe(
			'forbidden'
		);
		expect(access.accessRedirect(db, '/manage/missed-queries', auth.sessionUser(db, editor))).toBe(
			'forbidden'
		);
		expect(access.accessRedirect(db, '/manage/settings', auth.sessionUser(db, editor))).toBe(
			'forbidden'
		);
		expect(access.accessRedirect(db, '/manage/users', auth.sessionUser(db, editor))).toBe(
			'forbidden'
		);
		expect(access.accessRedirect(db, '/manage/duplicates', auth.sessionUser(db, editor))).toBe(
			'forbidden'
		);
		expect(access.accessRedirect(db, '/manage/api-keys', auth.sessionUser(db, editor))).toBe(
			'forbidden'
		);
		expect(access.accessRedirect(db, '/logout', auth.sessionUser(db, editor))).toBeUndefined();
		expect(access.accessRedirect(db, '/login', auth.sessionUser(db, editor))).toBe('/');
		expect(access.accessRedirect(db, '/account', auth.sessionUser(db, editor))).toBeUndefined();
		expect(
			access.accessRedirect(db, '/account/api-keys', auth.sessionUser(db, editor))
		).toBeUndefined();
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
			access.mayOpen(editor, '/manage/settings'),
			access.mayOpen(admin, '/manage/settings'),
			access.mayOpen(editor, '/account')
		]).toEqual([false, true, true]);
	});

	it('offers the setup again while no user has the role admin, even with other users', async () => {
		db.exec("DELETE FROM user_roles WHERE role = 'admin'");

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
		for (let attempt = 0; attempt < 4; attempt++) {
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

		expect(access.accessRedirect(db, '/setup', auth.sessionUser(db, session))).toBe('not-found');
		expect(access.accessRedirect(db, '/manage', undefined)).toBe('/login');
		expect(access.accessRedirect(db, '/logout', auth.sessionUser(db, 'forged'))).toBe('/login');
		expect(access.accessRedirect(db, '/account', undefined)).toBe('/login');
		expect(access.accessRedirect(db, '/login', undefined)).toBeUndefined();
		expect(access.accessRedirect(db, '/manage', auth.sessionUser(db, session))).toBeUndefined();
		expect(access.accessRedirect(db, '/login', auth.sessionUser(db, session))).toBe('/manage');
	});

	it('serves the reset of a forgotten password without a session', async () => {
		await setUp();

		for (const page of ['/login/forgot', '/login/reset/[token]']) {
			expect(access.accessRedirect(db, page, undefined)).toBeUndefined();
		}
	});

	it('serves a link to set a password also with a session, which sends others on', async () => {
		await setUp();
		const session = sessionOf(
			await auth.login(db, 'client', { email: 'admin@example.com', password: PASSWORD })
		);

		expect(
			access.accessRedirect(db, '/login/reset/[token]', auth.sessionUser(db, session))
		).toBeUndefined();
		expect(access.accessRedirect(db, '/login/forgot', auth.sessionUser(db, session))).toBe(
			'/manage'
		);
	});
});

describe('pages outside the account and management pages', () => {
	it('are served whatever the state, even before the setup', async () => {
		for (const path of ['/', '/sources', '/query', '/manage-tools', '/accounting']) {
			expect(access.accessRedirect(db, path, undefined)).toBeUndefined();
		}
	});
});

describe('grantAdmin', () => {
	beforeEach(() => setUp());

	const admins = () =>
		db
			.prepare(
				`SELECT email FROM users JOIN user_roles ON user_roles.user_id = users.id
				WHERE role = 'admin' ORDER BY email`
			)
			.all()
			.map((row) => row.email);

	it('changes nothing for an address without an account', () => {
		expect(auth.grantAdmin(db, 'nobody@example.com')).toBe('unknown-account');
		expect(admins()).toEqual(['admin@example.com']);
	});

	it('makes an account an admin beside the others, and reports an existing admin', async () => {
		await createUser(db, { email: 'reader@example.com', password: PASSWORD, roles: [] });
		const session = sessionOf(
			await auth.login(db, 'client', { email: 'reader@example.com', password: PASSWORD })
		);

		expect(auth.grantAdmin(db, ' Reader@Example.com ')).toBe('granted');
		expect(auth.grantAdmin(db, 'admin@example.com')).toBe('already-admin');
		expect(admins()).toEqual(['admin@example.com', 'reader@example.com']);
		expect(auth.sessionUser(db, session)?.roles).toEqual(['admin']);
	});

	it('sets a new password and ends the sessions and reset links of the account', async () => {
		const session = sessionOf(
			await auth.login(db, 'client', { email: 'admin@example.com', password: PASSWORD })
		);
		db.exec(
			`INSERT INTO password_resets (token_hash, user_id, expires_at)
			SELECT 'reset-hash', id, '2999-01-01T00:00:00.000Z' FROM users`
		);
		const NEW_PASSWORD = 'lighthouse ferry nineteen';

		expect(auth.grantAdmin(db, 'admin@example.com', await auth.hashPassword(NEW_PASSWORD))).toBe(
			'already-admin'
		);
		expect(auth.sessionUser(db, session)).toBeUndefined();
		expect(db.prepare('SELECT count(*) AS n FROM password_resets').get()).toEqual({ n: 0 });
		expect(
			await auth.login(db, 'other', { email: 'admin@example.com', password: NEW_PASSWORD })
		).toHaveProperty('session');
	});
});

describe('scripts/grant-admin.ts', () => {
	const script = join(import.meta.dirname, '../../../../../scripts/grant-admin.ts');

	function databaseWithAdmin(): string {
		const path = join(mkdtempSync(join(tmpdir(), 'grimoire-grant-')), 'grimoire.db');
		const fileDb = openDatabase(path);
		fileDb.exec(`INSERT INTO users (id, email, password_hash) VALUES
			(1, 'admin@example.com', 'x'), (2, 'ops@example.com', NULL);
			INSERT INTO user_roles (user_id, role) VALUES (1, 'admin');`);
		fileDb.close();
		return path;
	}

	function run(path: string, ...args: string[]) {
		return spawnSync(process.execPath, [script, ...args], {
			input: 'lighthouse ferry nineteen\n',
			env: { ...process.env, DATABASE_PATH: path },
			encoding: 'utf8'
		});
	}

	function admins(path: string): number[] {
		const check = openDatabase(path);
		const ids = check
			.prepare("SELECT user_id FROM user_roles WHERE role = 'admin' ORDER BY user_id")
			.all()
			.map((row) => row.user_id as number);
		check.close();
		return ids;
	}

	it('makes an account an admin and refuses an unknown address', () => {
		const path = databaseWithAdmin();

		expect(run(path, 'nobody@example.com')).toMatchObject({
			status: 1,
			stderr: expect.stringContaining('No account has that email address')
		});
		expect(run(path, 'ops@example.com')).toMatchObject({
			status: 0,
			stdout: expect.stringContaining('The account is now an admin.')
		});
		expect(admins(path)).toEqual([1, 2]);
	});

	it('takes a new password only from a terminal, and changes nothing without one', () => {
		const path = databaseWithAdmin();

		expect(run(path, 'ops@example.com', '--password')).toMatchObject({
			status: 1,
			stderr: expect.stringContaining('Run this in a terminal')
		});
		expect(admins(path)).toEqual([1]);
	});
});

describe('an account without a password', () => {
	it('refuses a password change as with a wrong current password', async () => {
		await createUser(db, { email: 'reader@example.com', password: PASSWORD, roles: [] });
		const session = sessionOf(
			await auth.login(db, 'client', { email: 'reader@example.com', password: PASSWORD })
		);
		db.exec("UPDATE users SET password_hash = NULL WHERE email = 'reader@example.com'");

		expect(
			await auth.changePassword(db, 'client', session, {
				current: '',
				password: 'a new long password'
			})
		).toEqual({ error: 'wrong-current-password' });
		expect(auth.hasPassword(db, auth.sessionUser(db, session)!.id)).toBe(false);
	});
});
