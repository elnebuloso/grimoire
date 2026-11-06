import { describe, it, expect, vi } from 'vitest';
import { isRedirect } from '@sveltejs/kit';
import { ProviderMisconfigured, ProviderUnavailable } from '#lib/server/oidc/flow.js';
import { sha256 } from '#lib/server/sha256.js';

const startFlow = vi.fn();
const adminExists = vi.fn(() => true);

vi.mock('$app/env/private', () => ({
	ENCRYPTION_KEY: { oidcFlows: Buffer.alloc(32) },
	LOG_FORMAT: 'ecs',
	LOG_LEVEL: 'error',
	TZ: 'UTC'
}));
vi.mock('#lib/server/db/index.js', () => ({ database: () => undefined }));
vi.mock('#lib/server/auth/auth.js', async (original) => ({
	...(await original<typeof import('#lib/server/auth/auth.js')>()),
	checkAdminAccount: () => adminExists()
}));
vi.mock('#lib/server/oidc/index.js', () => ({
	providerByKey: (key: string) => (key === 'gitlab' ? { key: 'gitlab' } : undefined)
}));
vi.mock('#lib/server/oidc/flow.js', async (original) => ({
	...(await original<typeof import('#lib/server/oidc/flow.js')>()),
	startFlow: (...args: unknown[]) => startFlow(...args)
}));

async function start(
	cookies: unknown = { get: () => undefined, set: vi.fn(), delete: vi.fn() }
): Promise<string> {
	const { POST } = await import('./+server');
	try {
		await POST({
			params: { key: 'gitlab' },
			request: new Request('https://grimoire.example/auth/oidc/gitlab', {
				method: 'POST',
				body: new URLSearchParams()
			}),
			cookies,
			url: new URL('https://grimoire.example/auth/oidc/gitlab')
		} as never);
	} catch (thrown) {
		if (isRedirect(thrown)) return thrown.location;
		throw thrown;
	}
	throw new Error('no redirect');
}

describe('starting a login before setup', () => {
	it('leads to the setup and starts no flow while there is no admin', async () => {
		adminExists.mockReturnValueOnce(false);
		startFlow.mockClear();

		expect(await start()).toBe('/setup');
		expect(startFlow).not.toHaveBeenCalled();
	});
});

describe('starting a login at a provider that cannot be used', () => {
	it('asks to try later when the provider is down', async () => {
		startFlow.mockRejectedValue(new ProviderUnavailable('discovery failed: HTTP 503'));
		expect(await start()).toBe('/login?problem=oidc-unavailable');
	});

	it('asks to tell an admin when its settings are wrong', async () => {
		startFlow.mockRejectedValue(new ProviderMisconfigured('discovery failed: issuer mismatch'));
		expect(await start()).toBe('/login?problem=oidc-misconfigured');
	});
});

describe('starting a login while logged in', () => {
	it('keeps the session and hands its hash to the flow, to end it once the login succeeds', async () => {
		startFlow.mockRejectedValue(new ProviderUnavailable('discovery failed: HTTP 503'));
		const cookies = { get: () => 'current-session', set: vi.fn(), delete: vi.fn() };

		await start(cookies as never);

		expect(cookies.delete).not.toHaveBeenCalled();
		expect(startFlow).toHaveBeenCalledWith(
			expect.anything(),
			expect.objectContaining({ replaces: sha256('current-session') })
		);
	});
});
