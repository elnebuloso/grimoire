import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { DatabaseSync } from 'node:sqlite';
import { isHttpError, isRedirect } from '@sveltejs/kit';
import { openDatabase } from '#lib/server/db/schema.js';

let db: DatabaseSync;
let warnings: string[];

// The real accessor opens the file from the environment, and `hooks.server.ts` would start the
// sync; the handlers get an in-memory database instead.
vi.mock('#lib/server/db/index.js', () => ({ database: () => db }));
vi.mock('#lib/server/sync/index.js', () => ({ startSyncPolling: () => {} }));
vi.mock('$app/env/private', () => ({ MIGRATE_ONLY: false }));

const PASSWORD = 'correct horse battery';

type Options = Record<string, unknown>;

function fakeCookies(initial: Record<string, string> = {}) {
	const values = new Map(Object.entries(initial));
	const calls: { name: string; value?: string; options: Options; deleted?: true }[] = [];
	return {
		calls,
		get: (name: string) => values.get(name),
		set(name: string, value: string, options: Options) {
			values.set(name, value);
			calls.push({ name, value, options });
		},
		delete(name: string, options: Options) {
			values.delete(name);
			calls.push({ name, options, deleted: true });
		}
	};
}

function formRequest(path: string, fields: Record<string, string>) {
	return new Request(`https://grimoire.example${path}`, {
		method: 'POST',
		body: new URLSearchParams(fields)
	});
}

/** Runs a handler that ends by throwing a redirect or an HTTP error, and returns what it threw. */
async function thrown(run: () => unknown): Promise<unknown> {
	try {
		await run();
	} catch (error) {
		return error;
	}
	throw new Error('expected the handler to throw');
}

// Setup token, failed logins and whether an admin was seen are module state; each test starts
// with fresh modules.
async function load() {
	vi.resetModules();
	return {
		auth: await import('#lib/server/admin/auth.js'),
		setup: (await import('./setup/+page.server')).actions.default,
		login: (await import('./login/+page.server')).actions.default,
		logout: (await import('./logout/+server')).POST,
		password: (await import('./password/+page.server')).actions.default,
		handleAdminAccess: (await import('../../hooks.server')).handleAdminAccess
	};
}

let admin: Awaited<ReturnType<typeof load>>;

function setupToken(): string {
	admin.auth.checkAdminAccount(db);
	return warnings
		.findLast((message) => message.includes('setup token'))!
		.split(' ')
		.at(-1)!;
}

async function setUpAdmin() {
	const cookies = fakeCookies();
	await thrown(() =>
		admin.setup({
			request: formRequest('/admin/setup', {
				token: setupToken(),
				username: 'admin',
				password: PASSWORD
			}),
			cookies,
			getClientAddress: () => 'setup-client'
		} as never)
	);
	return cookies.get('grimoire_session')!;
}

beforeEach(async () => {
	warnings = [];
	vi.spyOn(console, 'warn').mockImplementation((message: string) => void warnings.push(message));
	db = openDatabase(':memory:');
	admin = await load();
});

const SESSION_OPTIONS = { path: '/', httpOnly: true, sameSite: 'strict' };

describe('setup action', () => {
	it('creates the account, sets the session cookie and redirects to the admin area', async () => {
		const cookies = fakeCookies();
		const result = await thrown(() =>
			admin.setup({
				request: formRequest('/admin/setup', {
					token: setupToken(),
					username: 'admin',
					password: PASSWORD
				}),
				cookies,
				getClientAddress: () => 'client'
			} as never)
		);

		expect(isRedirect(result) && [result.status, result.location]).toEqual([303, '/admin']);
		expect(cookies.calls).toEqual([
			{ name: 'grimoire_session', value: expect.any(String), options: SESSION_OPTIONS }
		]);
		expect(admin.auth.sessionValid(db, cookies.get('grimoire_session'))).toBe(true);
	});

	it('answers a wrong token with 400, the message and the username, without a cookie', async () => {
		setupToken();
		const cookies = fakeCookies();
		const result = await admin.setup({
			request: formRequest('/admin/setup', {
				token: 'guess',
				username: 'admin',
				password: PASSWORD
			}),
			cookies,
			getClientAddress: () => 'client'
		} as never);

		expect(result).toMatchObject({
			status: 400,
			data: { error: 'Wrong setup token. It is in the server log.', username: 'admin' }
		});
		expect(cookies.calls).toEqual([]);
	});
});

describe('login action', () => {
	beforeEach(setUpAdmin);

	it('sets the session cookie for the right credentials and redirects', async () => {
		const cookies = fakeCookies();
		const result = await thrown(() =>
			admin.login({
				request: formRequest('/admin/login', { username: 'admin', password: PASSWORD }),
				cookies,
				getClientAddress: () => 'client'
			} as never)
		);

		expect(isRedirect(result) && [result.status, result.location]).toEqual([303, '/admin']);
		expect(cookies.calls).toEqual([
			{ name: 'grimoire_session', value: expect.any(String), options: SESSION_OPTIONS }
		]);
	});

	it('answers wrong credentials with 400 and the username, without a cookie', async () => {
		const cookies = fakeCookies();
		const result = await admin.login({
			request: formRequest('/admin/login', { username: 'admin', password: 'wrong' }),
			cookies,
			getClientAddress: () => 'client'
		} as never);

		expect(result).toMatchObject({
			status: 400,
			data: { error: 'Wrong username or password.', username: 'admin' }
		});
		expect(cookies.calls).toEqual([]);
	});
});

describe('logout', () => {
	it('ends the session, deletes the cookie and redirects to the login', async () => {
		const session = await setUpAdmin();
		const cookies = fakeCookies({ grimoire_session: session });
		const result = await thrown(() =>
			admin.logout({ request: formRequest('/admin/logout', {}), cookies } as never)
		);

		expect(isRedirect(result) && [result.status, result.location]).toEqual([303, '/admin/login']);
		expect(admin.auth.sessionValid(db, session)).toBe(false);
		expect(cookies.calls).toEqual([
			{ name: 'grimoire_session', options: SESSION_OPTIONS, deleted: true }
		]);
	});
});

describe('password action', () => {
	it('changes the password for the session that sent it', async () => {
		const session = await setUpAdmin();
		const result = await admin.password({
			request: formRequest('/admin/password', {
				current: PASSWORD,
				password: 'staple battery horse'
			}),
			cookies: fakeCookies({ grimoire_session: session }),
			getClientAddress: () => 'client'
		} as never);

		expect(result).toEqual({ changed: true });
		expect(admin.auth.sessionValid(db, session)).toBe(true);
		expect(
			'session' in
				admin.auth.login(db, 'other', { username: 'admin', password: 'staple battery horse' })
		).toBe(true);
	});

	it('answers a wrong current password with 400 and the message', async () => {
		const session = await setUpAdmin();
		const result = await admin.password({
			request: formRequest('/admin/password', { current: 'wrong', password: 'x'.repeat(12) }),
			cookies: fakeCookies({ grimoire_session: session }),
			getClientAddress: () => 'client'
		} as never);

		expect(result).toMatchObject({ status: 400, data: { error: 'Wrong current password.' } });
	});
});

describe('admin access guard', () => {
	const served = new Response('served');

	function request(path: string, session?: string) {
		const resolve = vi.fn(async () => served);
		const event = {
			url: new URL(`https://grimoire.example${path}`),
			cookies: fakeCookies(session ? { grimoire_session: session } : {})
		};
		return { resolve, run: () => admin.handleAdminAccess({ event, resolve } as never) };
	}

	it('sends every admin page to the setup while there is no admin', async () => {
		const result = await thrown(request('/admin').run);

		expect(isRedirect(result) && [result.status, result.location]).toEqual([303, '/admin/setup']);
		expect(await request('/admin/setup').run()).toBe(served);
	});

	it('hides the setup once done and requires a session for the admin area', async () => {
		const session = await setUpAdmin();

		const setupAgain = await thrown(request('/admin/setup', session).run);
		const withoutSession = await thrown(request('/admin').run);
		const page = request('/admin', session);

		expect(isHttpError(setupAgain) && setupAgain.status).toBe(404);
		expect(isRedirect(withoutSession) && withoutSession.location).toBe('/admin/login');
		expect(await page.run()).toBe(served);
		expect(page.resolve).toHaveBeenCalledOnce();
	});

	it('leaves paths outside the admin area alone', async () => {
		for (const path of ['/admin-tools', '/projects', '/mcp']) {
			const outside = request(path);

			expect(await outside.run()).toBe(served);
		}
		expect(warnings).toEqual([]);
	});
});
