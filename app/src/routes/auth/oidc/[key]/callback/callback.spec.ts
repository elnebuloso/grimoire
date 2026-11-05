import { describe, it, expect, beforeAll, beforeEach, vi } from 'vitest';
import type { DatabaseSync } from 'node:sqlite';
import { isRedirect } from '@sveltejs/kit';
import * as client from 'openid-client';
import { openDatabase } from '#lib/server/db/schema.js';
import { deriveKeys } from '#lib/server/secret-encryption.js';
import { ProviderUnavailable, sealFlow, type OidcFlow } from '#lib/server/oidc/flow.js';
import { createLinkedUser } from '#lib/server/oidc/identities.js';
import { FLOW_COOKIE } from '#lib/server/oidc/cookie.js';
import type { OidcProvider } from '#lib/server/oidc/index.js';
import type { SessionUser } from '#lib/server/admin/auth.js';

const KEYS = deriveKeys(Buffer.alloc(32, 7));
const ISSUER = 'https://gitlab.example.com';
const PROVIDER: OidcProvider = {
	key: 'gitlab',
	issuer: ISSUER,
	clientId: 'grimoire',
	clientSecret: 'secret',
	label: 'GitLab',
	allowedDomains: ['example.com'],
	requiredClaims: [],
	redirectUri: 'https://grimoire.example/auth/oidc/gitlab/callback'
};

let db: DatabaseSync;
let logged: () => Record<string, unknown>[];
const messages = () => logged().map((line) => line.message);
const finishFlow = vi.fn();

vi.mock('#lib/server/db/index.js', () => ({ database: () => db }));
vi.mock('$app/env/private', () => ({
	ENCRYPTION_KEY: KEYS,
	LOG_FORMAT: 'ecs',
	LOG_LEVEL: 'info',
	TZ: 'UTC'
}));
vi.mock('#lib/server/oidc/index.js', () => ({
	providerByKey: (key: unknown) => (key === PROVIDER.key ? PROVIDER : undefined)
}));
vi.mock('#lib/server/oidc/flow.js', async (original) => ({
	...(await original<typeof import('#lib/server/oidc/flow.js')>()),
	finishFlow: (...args: unknown[]) => finishFlow(...args)
}));

function flowCookie(changes: Partial<OidcFlow> = {}): string {
	const flow: OidcFlow = {
		provider: 'gitlab',
		verifier: 'verifier',
		state: 'state',
		nonce: 'nonce',
		next: '',
		expiresAt: new Date(Date.now() + 600_000).toISOString(),
		...changes
	};
	return sealFlow(flow, KEYS.oidcFlows);
}

function fakeCookies(initial: Record<string, string>) {
	const values = new Map(Object.entries(initial));
	return {
		get: (name: string) => values.get(name),
		set: (name: string, value: string) => values.set(name, value),
		delete: (name: string) => values.delete(name)
	};
}

/** Runs the callback for `client` and returns where it sends the browser. */
async function answer(
	client: string,
	cookies = fakeCookies({ [FLOW_COOKIE]: flowCookie() }),
	locals: App.Locals = {}
) {
	const { load } = await import('./+page.server');
	try {
		const result = await load({
			params: { key: 'gitlab' },
			url: new URL(`${PROVIDER.redirectUri}?code=code&state=state`),
			cookies,
			getClientAddress: () => client,
			locals
		} as never);
		return (result as { next: string }).next;
	} catch (thrown) {
		if (isRedirect(thrown)) return thrown.location;
		throw thrown;
	}
}

// The first import transforms the modules, which on a busy machine took seconds, past the timeout
// of a hook or test; imports after `vi.resetModules` reuse the transforms and take milliseconds.
beforeAll(() => import('./+page.server'), 60_000);

beforeEach(async () => {
	// The attempt limit is module state; each test starts with a fresh one.
	vi.resetModules();
	// The fresh callback module logs through the fresh log module.
	logged = (await import('#lib/server/capture-log.js')).captureLog().lines;
	db = openDatabase(':memory:');
	finishFlow.mockReset();
});

describe('the attempt limit of the callback', () => {
	it('does not count logins that succeed, however many come from one address', async () => {
		createLinkedUser(db, 'ada@example.com', ISSUER, 'ada');
		finishFlow.mockResolvedValue({ iss: ISSUER, sub: 'ada' });

		for (let login = 0; login < 40; login++) {
			expect(await answer('203.0.113.7')).toBe('/');
		}
	});

	it('stops a client whose answers keep failing, with a message of its own', async () => {
		finishFlow.mockRejectedValue(new Error('invalid_grant'));

		for (let attempt = 0; attempt < 30; attempt++) {
			expect(await answer('203.0.113.8')).toBe('/login?problem=oidc-failed');
		}
		expect(await answer('203.0.113.8')).toBe('/login?problem=oidc-blocked');
		expect(await answer('203.0.113.9')).toBe('/login?problem=oidc-failed');
		expect(messages()).toContain('OIDC login through gitlab failed: Error: invalid_grant');
		expect(messages()).toContain(
			'OIDC login through gitlab refused: too many failed logins from the client'
		);
	});
});

describe('a callback without a flow', () => {
	it('forwards a logged-in user home, as after going back to it or reloading it', async () => {
		const user: SessionUser = { id: 1, email: 'ada@example.com', roles: ['admin'] };

		expect(await answer('203.0.113.10', fakeCookies({}), { user })).toBe('/manage');
		expect(finishFlow).not.toHaveBeenCalled();
	});

	it('tells a visitor who is not logged in that the login did not complete, and logs why', async () => {
		const expired = flowCookie({ expiresAt: new Date(Date.now() - 1000).toISOString() });
		const entra = flowCookie({ provider: 'entra' });

		expect(await answer('203.0.113.10', fakeCookies({}))).toBe('/login?problem=oidc-failed');
		await answer('203.0.113.10', fakeCookies({ [FLOW_COOKIE]: expired }));
		await answer('203.0.113.10', fakeCookies({ [FLOW_COOKIE]: entra }));
		await answer('203.0.113.10', fakeCookies({ [FLOW_COOKIE]: 'not-a-sealed-flow' }));

		expect(messages()).toEqual([
			'OIDC login through gitlab failed: the flow cookie is missing',
			'OIDC login through gitlab failed: the flow cookie is expired',
			'OIDC login through gitlab failed: the flow cookie is for another provider',
			'OIDC login through gitlab failed: the flow cookie is unreadable'
		]);
		expect(finishFlow).not.toHaveBeenCalled();
	});
});

describe('a code exchange that fails', () => {
	it('logs a configuration error with its OAuth error at warn', async () => {
		finishFlow.mockRejectedValue(
			new client.ResponseBodyError('server responded with an error in the response body', {
				cause: { error: 'invalid_client' },
				response: new Response(null, { status: 401 })
			})
		);

		expect(await answer('203.0.113.11')).toBe('/login?problem=oidc-failed');
		expect(logged()).toContainEqual(
			expect.objectContaining({
				'log.level': 'warn',
				message: 'OIDC login through gitlab failed: invalid_client (HTTP 401)'
			})
		);
	});

	it('logs a cancel at the provider at info', async () => {
		finishFlow.mockRejectedValue(
			new client.AuthorizationResponseError('authorization response error', {
				cause: new URLSearchParams({ error: 'access_denied' })
			})
		);

		expect(await answer('203.0.113.11')).toBe('/login?problem=oidc-failed');
		expect(logged()).toContainEqual(
			expect.objectContaining({
				'log.level': 'info',
				message: 'OIDC login through gitlab failed: access_denied'
			})
		);
	});

	it('tells the user the provider is unavailable when it is down', async () => {
		finishFlow.mockRejectedValue(new ProviderUnavailable('token request failed: TypeError'));

		expect(await answer('203.0.113.11')).toBe('/login?problem=oidc-unavailable');
	});
});
