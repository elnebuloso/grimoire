import { describe, it, expect, beforeAll, beforeEach, vi } from 'vitest';
import type { DatabaseSync } from 'node:sqlite';
import { isRedirect } from '@sveltejs/kit';
import * as client from 'openid-client';
import { openDatabase } from '#lib/server/db/schema.js';
import { deriveKeys } from '#lib/server/secret-encryption.js';
import { ProviderUnavailable, sealFlow, type OidcFlow } from '#lib/server/oidc/flow.js';
import { createLinkedUser } from '#lib/server/oidc/identities.js';
import { inviteUser } from '#lib/server/admin/invitations.js';
import { FLOW_COOKIE } from '#lib/server/oidc/cookie.js';
import type { OidcProvider } from '#lib/server/oidc/index.js';
import { createSession, type SessionUser } from '#lib/server/admin/auth.js';
import { sha256 } from '#lib/server/sha256.js';

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

/**
 * Runs the callback for `client` and returns where it sends the browser: the page it forwards to,
 * or `redirect:` and the target of a redirect, which a strict session cookie does not follow.
 */
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
		if (isRedirect(thrown)) return `redirect:${thrown.location}`;
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

describe('where a login lands', () => {
	const WELCOME = '/account/api-keys?welcome';

	it('welcomes an account the login creates at its API keys', async () => {
		finishFlow.mockResolvedValue({
			iss: ISSUER,
			sub: 'ada',
			email: 'ada@example.com',
			email_verified: true
		});
		expect(await answer('203.0.113.7')).toBe(WELCOME);
	});

	it('welcomes an account an invitation creates at its API keys', async () => {
		const admin = createLinkedUser(db, 'admin@example.com', ISSUER, 'admin')!;
		const invitation = inviteUser(db, 'partner@partner.example', admin);
		if ('error' in invitation) throw new Error(invitation.error);
		finishFlow.mockResolvedValue({ iss: ISSUER, sub: 'partner' });
		const cookies = fakeCookies({ [FLOW_COOKIE]: flowCookie({ invite: invitation.token }) });
		expect(await answer('203.0.113.7', cookies)).toBe(WELCOME);
	});

	it('sends a later login of a user without a role to the start page', async () => {
		createLinkedUser(db, 'ada@example.com', ISSUER, 'ada');
		finishFlow.mockResolvedValue({ iss: ISSUER, sub: 'ada' });
		expect(await answer('203.0.113.7')).toBe('/');
	});

	it('keeps the target the login started from, also on the first login', async () => {
		finishFlow.mockResolvedValue({
			iss: ISSUER,
			sub: 'ada',
			email: 'ada@example.com',
			email_verified: true
		});
		const cookies = fakeCookies({ [FLOW_COOKIE]: flowCookie({ next: '/sources' }) });
		expect(await answer('203.0.113.7', cookies)).toBe('/sources');
	});
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

		expect(await answer('203.0.113.10', fakeCookies({}), { user })).toBe('redirect:/manage');
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
	it('asks to tell an admin about a configuration error, logged at warn', async () => {
		finishFlow.mockRejectedValue(
			new client.ResponseBodyError('server responded with an error in the response body', {
				cause: { error: 'invalid_client' },
				response: new Response(null, { status: 401 })
			})
		);

		expect(await answer('203.0.113.11')).toBe('/login?problem=oidc-misconfigured');
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

describe('a login while another session is open in the browser', () => {
	function sessionCookie() {
		createLinkedUser(db, 'grace@example.com', ISSUER, 'grace');
		const previous = createSession(db, 1, new Date());
		const cookies = fakeCookies({ [FLOW_COOKIE]: flowCookie({ replaces: sha256(previous) }) });
		const open = () =>
			db.prepare('SELECT count(*) AS n FROM sessions WHERE token_hash = ?').get(sha256(previous));
		return { cookies, open };
	}

	it('ends that session once the login succeeds', async () => {
		const { cookies, open } = sessionCookie();
		createLinkedUser(db, 'ada@example.com', ISSUER, 'ada');
		finishFlow.mockResolvedValue({ iss: ISSUER, sub: 'ada' });

		await answer('203.0.113.14', cookies);
		expect(open()).toEqual({ n: 0 });
	});

	it('keeps it when the login is cancelled at the provider', async () => {
		const { cookies, open } = sessionCookie();
		finishFlow.mockRejectedValue(
			new client.AuthorizationResponseError('authorization response error', {
				cause: new URLSearchParams({ error: 'access_denied' })
			})
		);

		await answer('203.0.113.14', cookies);
		expect(open()).toEqual({ n: 1 });
	});
});

describe('a refused link of a logged-in user', () => {
	// The hash of the session that started the link; the callback only passes it on.
	const linking = (changes: Partial<OidcFlow> = {}) =>
		fakeCookies({ [FLOW_COOKIE]: flowCookie({ link: 'session-hash', ...changes }) });

	it('returns to the account page when the user cancels at the provider', async () => {
		finishFlow.mockRejectedValue(
			new client.AuthorizationResponseError('authorization response error', {
				cause: new URLSearchParams({ error: 'access_denied' })
			})
		);

		expect(await answer('203.0.113.12', linking())).toBe('/account?problem=oidc-failed');
	});

	it('returns to the account page when the provider is down or the flow expired', async () => {
		finishFlow.mockRejectedValue(new ProviderUnavailable('token request failed: TypeError'));
		const expired = linking({ expiresAt: new Date(Date.now() - 1000).toISOString() });

		expect(await answer('203.0.113.12', linking())).toBe('/account?problem=oidc-unavailable');
		expect(await answer('203.0.113.12', expired)).toBe('/account?problem=oidc-failed');
	});

	it('returns to the account page when the client is blocked', async () => {
		finishFlow.mockRejectedValue(new Error('invalid_grant'));
		for (let attempt = 0; attempt < 30; attempt++) await answer('203.0.113.13', linking());

		expect(await answer('203.0.113.13', linking())).toBe('/account?problem=oidc-blocked');
	});
});
