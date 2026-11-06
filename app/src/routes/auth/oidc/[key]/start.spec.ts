import { describe, it, expect, vi } from 'vitest';
import { isRedirect } from '@sveltejs/kit';
import { ProviderMisconfigured, ProviderUnavailable } from '#lib/server/oidc/flow.js';

const startFlow = vi.fn();

vi.mock('$app/env/private', () => ({
	ENCRYPTION_KEY: { oidcFlows: Buffer.alloc(32) },
	LOG_FORMAT: 'ecs',
	LOG_LEVEL: 'error',
	TZ: 'UTC'
}));
vi.mock('#lib/server/db/index.js', () => ({ database: () => undefined }));
vi.mock('#lib/server/oidc/index.js', () => ({
	providerByKey: (key: string) => (key === 'gitlab' ? { key: 'gitlab' } : undefined)
}));
vi.mock('#lib/server/oidc/flow.js', async (original) => ({
	...(await original<typeof import('#lib/server/oidc/flow.js')>()),
	startFlow: (...args: unknown[]) => startFlow(...args)
}));

async function start(): Promise<string> {
	const { POST } = await import('./+server');
	try {
		await POST({
			params: { key: 'gitlab' },
			request: new Request('https://grimoire.example/auth/oidc/gitlab', {
				method: 'POST',
				body: new URLSearchParams()
			}),
			cookies: { get: () => undefined, set: vi.fn(), delete: vi.fn() },
			url: new URL('https://grimoire.example/auth/oidc/gitlab')
		} as never);
	} catch (thrown) {
		if (isRedirect(thrown)) return thrown.location;
		throw thrown;
	}
	throw new Error('no redirect');
}

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
