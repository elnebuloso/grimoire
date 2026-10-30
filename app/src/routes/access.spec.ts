import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { DatabaseSync } from 'node:sqlite';
import { isHttpError, isRedirect } from '@sveltejs/kit';
import { openDatabase } from '#lib/server/db/schema.js';

let db: DatabaseSync;
let logged: () => string[];

// The real accessor opens the file from the environment, and `hooks.server.ts` would start the
// sync; the handlers get an in-memory database instead.
vi.mock('#lib/server/db/index.js', () => ({ database: () => db }));
vi.mock('#lib/server/sync/index.js', () => ({ startSyncPolling: () => {} }));
vi.mock('$app/env/private', () => ({
	MIGRATE_ONLY: false,
	LOG_FORMAT: 'ecs',
	LOG_LEVEL: 'info',
	TZ: 'UTC'
}));

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
	// The fresh auth module logs through the fresh log module.
	logged = (await import('#lib/server/capture-log.js')).captureLog().messages;
	return {
		auth: await import('#lib/server/admin/auth.js'),
		setup: (await import('./setup/+page.server')).actions.default,
		login: (await import('./login/+page.server')).actions.default,
		logout: (await import('./logout/+server')).POST,
		password: (await import('./account/+page.server')).actions.default,
		hooks: await import('../hooks.server'),
		handleAccess: (await import('../hooks.server')).handleAccess
	};
}

let admin: Awaited<ReturnType<typeof load>>;

function setupToken(): string {
	admin.auth.checkAdminAccount(db);
	return logged()
		.findLast((message) => message.includes('setup token'))!
		.split(' ')
		.at(-1)!;
}

async function setUpAdmin() {
	const cookies = fakeCookies();
	await thrown(() =>
		admin.setup({
			request: formRequest('/setup', {
				token: setupToken(),
				email: 'admin@example.com',
				password: PASSWORD
			}),
			cookies,
			getClientAddress: () => 'setup-client'
		} as never)
	);
	return cookies.get('grimoire_session')!;
}

beforeEach(async () => {
	db = openDatabase(':memory:');
	admin = await load();
});

const SESSION_OPTIONS = { path: '/', httpOnly: true, sameSite: 'strict' };

describe('setup action', () => {
	it('creates the account, sets the session cookie and redirects to the management area', async () => {
		const cookies = fakeCookies();
		const result = await thrown(() =>
			admin.setup({
				request: formRequest('/setup', {
					token: setupToken(),
					email: 'admin@example.com',
					password: PASSWORD
				}),
				cookies,
				getClientAddress: () => 'client'
			} as never)
		);

		expect(isRedirect(result) && [result.status, result.location]).toEqual([303, '/manage']);
		expect(cookies.calls).toEqual([
			{ name: 'grimoire_session', value: expect.any(String), options: SESSION_OPTIONS }
		]);
		expect(admin.auth.sessionUser(db, cookies.get('grimoire_session'))).toBeDefined();
	});

	it('answers a wrong token with 400, the message and the email address, without a cookie', async () => {
		setupToken();
		const cookies = fakeCookies();
		const result = await admin.setup({
			request: formRequest('/setup', {
				token: 'guess',
				email: 'admin@example.com',
				password: PASSWORD
			}),
			cookies,
			getClientAddress: () => 'client'
		} as never);

		expect(result).toMatchObject({
			status: 400,
			data: { error: 'Wrong setup token. It is in the server log.', email: 'admin@example.com' }
		});
		expect(cookies.calls).toEqual([]);
	});
});

describe('header', () => {
	it('links each user only to the pages they may open', async () => {
		const adminSession = await setUpAdmin();
		await admin.auth.createUser(db, { email: 'editor@example.com', password: PASSWORD, roles: [] });
		const login = await admin.auth.login(db, 'editor-pc', {
			email: 'editor@example.com',
			password: PASSWORD
		});
		if (!('session' in login)) throw new Error(login.error);
		const { load } = await import('./+layout.server');
		const header = (session?: string) =>
			(
				load({ cookies: fakeCookies(session ? { grimoire_session: session } : {}) } as never) as {
					user: unknown;
				}
			).user;

		expect(header(adminSession)).toEqual({ name: 'admin@example.com', mayManage: true });
		expect(header(login.session)).toEqual({ name: 'editor@example.com', mayManage: false });
		expect(header()).toBeUndefined();
	});
});

describe('login action', () => {
	beforeEach(setUpAdmin);

	it('sets the session cookie for the right credentials and redirects', async () => {
		const cookies = fakeCookies();
		const result = await thrown(() =>
			admin.login({
				request: formRequest('/login', { email: 'admin@example.com', password: PASSWORD }),
				cookies,
				getClientAddress: () => 'client'
			} as never)
		);

		expect(isRedirect(result) && [result.status, result.location]).toEqual([303, '/manage']);
		expect(cookies.calls).toEqual([
			{ name: 'grimoire_session', value: expect.any(String), options: SESSION_OPTIONS }
		]);
	});

	it('sends a user without the role admin to the start page instead of a 403', async () => {
		await admin.auth.createUser(db, { email: 'editor@example.com', password: PASSWORD, roles: [] });
		const result = await thrown(() =>
			admin.login({
				request: formRequest('/login', { email: 'editor@example.com', password: PASSWORD }),
				cookies: fakeCookies(),
				getClientAddress: () => 'client'
			} as never)
		);

		expect(isRedirect(result) && result.location).toBe('/');
	});

	it('answers wrong credentials with 400 and the email address, without a cookie', async () => {
		const cookies = fakeCookies();
		const result = await admin.login({
			request: formRequest('/login', { email: 'admin@example.com', password: 'wrong' }),
			cookies,
			getClientAddress: () => 'client'
		} as never);

		expect(result).toMatchObject({
			status: 400,
			data: { error: 'Wrong email address or password.', email: 'admin@example.com' }
		});
		expect(cookies.calls).toEqual([]);
	});
});

describe('logout', () => {
	it('ends the session, deletes the cookie and redirects to the login', async () => {
		const session = await setUpAdmin();
		const cookies = fakeCookies({ grimoire_session: session });
		const result = await thrown(() =>
			admin.logout({ request: formRequest('/logout', {}), cookies } as never)
		);

		expect(isRedirect(result) && [result.status, result.location]).toEqual([303, '/login']);
		expect(admin.auth.sessionUser(db, session)).toBeUndefined();
		expect(cookies.calls).toEqual([
			{ name: 'grimoire_session', options: SESSION_OPTIONS, deleted: true }
		]);
	});
});

describe('password action', () => {
	it('changes the password for the session that sent it', async () => {
		const session = await setUpAdmin();
		const result = await admin.password({
			request: formRequest('/account', {
				current: PASSWORD,
				password: 'staple battery horse'
			}),
			cookies: fakeCookies({ grimoire_session: session }),
			getClientAddress: () => 'client'
		} as never);

		expect(result).toEqual({ changed: true });
		expect(admin.auth.sessionUser(db, session)).toBeDefined();
		expect(
			'session' in
				(await admin.auth.login(db, 'other', {
					email: 'admin@example.com',
					password: 'staple battery horse'
				}))
		).toBe(true);
	});

	it('answers a wrong current password with 400 and the message', async () => {
		const session = await setUpAdmin();
		const result = await admin.password({
			request: formRequest('/account', { current: 'wrong', password: 'x'.repeat(12) }),
			cookies: fakeCookies({ grimoire_session: session }),
			getClientAddress: () => 'client'
		} as never);

		expect(result).toMatchObject({ status: 400, data: { error: 'Wrong current password.' } });
	});
});

describe('admin access guard', () => {
	const served = new Response('served');

	function request(
		path: string,
		session?: string,
		routeId: string | null = path,
		{ method = 'GET', response = served } = {}
	) {
		const resolve = vi.fn(async () => response);
		const url = new URL(`https://grimoire.example${path}`);
		const event = {
			url,
			request: new Request(url, { method }),
			isDataRequest: false,
			locals: {} as App.Locals,
			route: { id: routeId },
			cookies: fakeCookies(session ? { grimoire_session: session } : {})
		};
		return { event, resolve, run: () => admin.handleAccess({ event, resolve } as never) };
	}

	async function editorSession() {
		await setUpAdmin();
		await admin.auth.createUser(db, { email: 'editor@example.com', password: PASSWORD, roles: [] });
		const login = await admin.auth.login(db, 'editor-pc', {
			email: 'editor@example.com',
			password: PASSWORD
		});
		if (!('session' in login)) throw new Error(login.error);
		return login.session;
	}

	it('sends every admin page to the setup while there is no admin', async () => {
		const result = await thrown(request('/manage').run);

		expect(isRedirect(result) && [result.status, result.location]).toEqual([303, '/setup']);
		expect(await request('/setup').run()).toBe(served);
	});

	it('answers 403 to a user without the role admin', async () => {
		const result = await thrown(request('/manage', await editorSession()).run);

		expect(isHttpError(result) && result.status).toBe(403);
	});

	it('leaves a denied page view to the load, which renders the error page', async () => {
		const errorPage = new Response('error page', { status: 403 });
		const page = request('/manage/settings', await editorSession(), undefined, {
			response: errorPage
		});

		expect(await page.run()).toBe(errorPage);
		expect(page.event.locals.accessDenied).toBe(403);
	});

	it('denies a form action before it runs', async () => {
		const action = request('/manage/settings', await editorSession(), undefined, {
			method: 'POST'
		});

		const result = await thrown(action.run);

		expect(isHttpError(result) && result.status).toBe(403);
		expect(action.resolve).not.toHaveBeenCalled();
	});

	it('hides the setup once done and requires a session for the management area', async () => {
		const session = await setUpAdmin();

		const setupAgain = await thrown(request('/setup', session).run);
		const withoutSession = await thrown(request('/manage').run);
		const page = request('/manage', session);

		expect(isHttpError(setupAgain) && setupAgain.status).toBe(404);
		expect(isRedirect(withoutSession) && withoutSession.location).toBe('/login');
		expect(await page.run()).toBe(served);
		expect(page.resolve).toHaveBeenCalledOnce();
	});

	it('guards a percent-encoded path by the route the router matched', async () => {
		await setUpAdmin();

		const encoded = await thrown(request('/m%61nage/api-keys', undefined, '/manage/api-keys').run);

		expect(isRedirect(encoded) && encoded.location).toBe('/login');
	});

	it('serves a path without a route, which ends in a 404', async () => {
		await setUpAdmin();

		expect(await request('/m%61nage-nothing', undefined, null).run()).toBe(served);
	});

	it('leaves paths outside the management area alone', async () => {
		for (const path of ['/manage-tools', '/sources', '/mcp']) {
			const outside = request(path);

			expect(await outside.run()).toBe(served);
		}
		expect(logged()).toEqual([]);
	});

	it('requires a login for every route of the management area and the account', async () => {
		await setUpAdmin();
		// Read from the files, so a new route, or one moved into a route group, is checked too.
		const routeIds = Object.keys(import.meta.glob('./**/+{page.svelte,page.server.ts,server.ts}'))
			.map((file) => file.slice(1, file.lastIndexOf('/')) || '/')
			.filter((id) => {
				const path = id.replace(/\/\([^)]*\)/g, '');
				return ['/manage', '/account'].some((area) => path === area || path.startsWith(`${area}/`));
			});

		expect(routeIds.length).toBeGreaterThan(10);
		for (const id of new Set(routeIds)) {
			const result = await thrown(request(id, undefined, id).run).catch(() => 'served');

			expect([id, isRedirect(result) && result.location]).toEqual([id, '/login']);
		}
	});
});

describe('handleError', () => {
	const event = {
		request: new Request('https://grimoire.example/manage/sources/1', { method: 'POST' }),
		url: new URL('https://grimoire.example/manage/sources/1')
	};

	it('logs an unexpected error with its stack in one line', async () => {
		admin.hooks.handleError({ error: new TypeError('no route'), event, kind: 'unknown' } as never);

		expect(logged()).toEqual(['POST /manage/sources/1 failed']);
	});

	it('logs nothing for an expected error such as a missing page', async () => {
		admin.hooks.handleError({ error: new Error('Not found'), event, kind: 'not_found' } as never);

		expect(logged()).toEqual([]);
	});
});
