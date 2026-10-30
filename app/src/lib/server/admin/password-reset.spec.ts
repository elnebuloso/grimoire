import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { DatabaseSync } from 'node:sqlite';
import { openDatabase } from '../db/schema';

type Auth = typeof import('./auth');
type Reset = typeof import('./password-reset');

let auth: Auth;
let reset: Reset;
let db: DatabaseSync;

const EMAIL = 'admin@example.com';
const PASSWORD = 'correct horse battery';
const NEW_PASSWORD = 'staple battery horse';
const NOW = new Date('2026-10-30T12:00:00Z');
const minutesLater = (minutes: number) => new Date(NOW.getTime() + minutes * 60_000);

// Request counts and failed logins live in module state, so every test gets fresh modules.
beforeEach(async () => {
	vi.resetModules();
	auth = await import('./auth');
	reset = await import('./password-reset');
	db = openDatabase(':memory:');
	await auth.createUser(db, { email: EMAIL, password: PASSWORD, roles: ['admin'] });
});

function tokenFor(email = EMAIL, client = 'client', at = NOW): string {
	const result = reset.requestPasswordReset(db, client, email, at);
	if (!result || result === 'reset-blocked') throw new Error(`no token: ${result}`);
	return result.token;
}

async function logsIn(password: string, at = NOW): Promise<boolean> {
	return 'session' in (await auth.login(db, `login-${password}`, { email: EMAIL, password }, at));
}

describe('requestPasswordReset', () => {
	it('issues a token for a known address in any letter case and nothing for an unknown one', () => {
		const result = reset.requestPasswordReset(db, 'client', ' Admin@Example.com ', NOW);

		expect(result).toEqual({ to: EMAIL, token: expect.any(String) });
		expect(reset.requestPasswordReset(db, 'client', 'nobody@example.com', NOW)).toBeUndefined();
	});

	it('stores only a hash of the token', () => {
		const token = tokenFor();

		expect(JSON.stringify(db.prepare('SELECT * FROM password_resets').all())).not.toContain(token);
	});

	it('blocks a client after 5 requests within an hour, whatever the addresses', () => {
		for (let request = 0; request < 5; request++) {
			expect(reset.requestPasswordReset(db, 'flood', `x${request}@example.com`, NOW)).not.toBe(
				'reset-blocked'
			);
		}

		expect(reset.requestPasswordReset(db, 'flood', EMAIL, NOW)).toBe('reset-blocked');
		expect(reset.requestPasswordReset(db, 'other', EMAIL, NOW)).toHaveProperty('token');
		expect(reset.requestPasswordReset(db, 'flood', EMAIL, minutesLater(61))).toHaveProperty(
			'token'
		);
	});

	it('sends at most 3 links an hour to one address, silently, from any clients', () => {
		for (const client of ['a', 'b', 'c']) expect(tokenFor(EMAIL, client)).toBeTruthy();

		expect(reset.requestPasswordReset(db, 'd', EMAIL, NOW)).toBeUndefined();
		expect(reset.requestPasswordReset(db, 'd', EMAIL, minutesLater(61))).toHaveProperty('token');
	});
});

describe('resetPassword', () => {
	it('sets the new password once; the link is void afterwards', async () => {
		const token = tokenFor();

		expect(await reset.resetPassword(db, token, NEW_PASSWORD, NOW)).toBeUndefined();
		expect(await logsIn(NEW_PASSWORD)).toBe(true);
		expect(await logsIn(PASSWORD)).toBe(false);
		expect(reset.resetLinkValid(db, token, NOW)).toBe(false);
		expect(await reset.resetPassword(db, token, 'another long password', NOW)).toBe(
			'reset-link-invalid'
		);
	});

	it('lets only one of two requests with the same link through', async () => {
		const token = tokenFor();

		const results = await Promise.all([
			reset.resetPassword(db, token, NEW_PASSWORD, NOW),
			reset.resetPassword(db, token, 'another long password', NOW)
		]);

		expect(results.toSorted()).toEqual(['reset-link-invalid', undefined]);
	});

	it('refuses an expired or unknown link', async () => {
		const token = tokenFor();

		expect(reset.resetLinkValid(db, token, minutesLater(59))).toBe(true);
		expect(reset.resetLinkValid(db, token, minutesLater(60))).toBe(false);
		expect(await reset.resetPassword(db, token, NEW_PASSWORD, minutesLater(60))).toBe(
			'reset-link-invalid'
		);
		expect(await reset.resetPassword(db, 'guess', NEW_PASSWORD, NOW)).toBe('reset-link-invalid');
		expect(await logsIn(PASSWORD)).toBe(true);
	});

	it('keeps the link for a password that is too short', async () => {
		const token = tokenFor();

		expect(await reset.resetPassword(db, token, 'short', NOW)).toBe('password-too-short');
		expect(reset.resetLinkValid(db, token, NOW)).toBe(true);
	});

	it('ends every session of the user and voids their other links', async () => {
		const session = await auth.login(db, 'laptop', { email: EMAIL, password: PASSWORD }, NOW);
		if (!('session' in session)) throw new Error(session.error);
		const first = tokenFor(EMAIL, 'a');
		const second = tokenFor(EMAIL, 'b');

		await reset.resetPassword(db, second, NEW_PASSWORD, NOW);

		expect(auth.sessionUser(db, session.session, NOW)).toBeUndefined();
		expect(reset.resetLinkValid(db, first, NOW)).toBe(false);
	});
});
