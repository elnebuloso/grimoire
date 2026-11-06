import { afterEach, describe, it, expect, vi } from 'vitest';
import { deriveKeys } from '../secret-encryption';
import * as client from 'openid-client';
import {
	classifyLoginFailure,
	openFlow,
	ProviderUnavailable,
	sealFlow,
	startFlow,
	unavailableMessage,
	type OidcFlow
} from './flow';
import type { OidcProvider } from './config';

const { oidcFlows, formSecrets } = deriveKeys(Buffer.alloc(32, 3));
const NOW = new Date('2026-11-04T12:00:00.000Z');
const FLOW: OidcFlow = {
	provider: 'gitlab',
	verifier: 'verifier',
	state: 'state',
	nonce: 'nonce',
	next: '/manage/sources',
	expiresAt: '2026-11-04T12:10:00.000Z'
};

describe('the flow cookie', () => {
	it('carries the flow for its provider until it expires', () => {
		const sealed = sealFlow(FLOW, oidcFlows);

		expect(sealed).not.toContain('verifier');
		expect(openFlow(sealed, 'gitlab', oidcFlows, NOW)).toEqual({ flow: FLOW });
		expect(openFlow(sealed, 'gitlab', oidcFlows, new Date(FLOW.expiresAt))).toEqual({
			problem: 'expired',
			expired: FLOW
		});
	});

	it('is not taken for another provider, under another key, changed, or missing', () => {
		const sealed = sealFlow(FLOW, oidcFlows);
		const changed = `${sealed.slice(0, -4)}AAAA`;

		expect(openFlow(sealed, 'entra', oidcFlows, NOW)).toEqual({ problem: 'for another provider' });
		expect(openFlow(sealed, 'gitlab', formSecrets, NOW)).toEqual({ problem: 'unreadable' });
		expect(openFlow(changed, 'gitlab', oidcFlows, NOW)).toEqual({ problem: 'unreadable' });
		expect(openFlow(undefined, 'gitlab', oidcFlows, NOW)).toEqual({ problem: 'missing' });
	});
});

describe('a failed login', () => {
	const METADATA = {
		issuer: 'https://gitlab.example.com',
		authorization_endpoint: 'https://gitlab.example.com/oauth/authorize',
		token_endpoint: 'https://gitlab.example.com/oauth/token'
	};

	// What openid-client throws when the token endpoint answers with `answer`.
	async function failedExchange(answer: () => Response, query = 'code=abc&state=state') {
		const config = new client.Configuration(METADATA, 'grimoire', 'client-secret');
		config[client.customFetch] = async () => answer();
		return client
			.authorizationCodeGrant(
				config,
				new URL(`https://grimoire.example.com/auth/oidc/gitlab/callback?${query}`),
				{ pkceCodeVerifier: 'v'.repeat(43), expectedState: 'state', idTokenExpected: true }
			)
			.then(
				() => expect.unreachable('the exchange succeeded'),
				(failure: unknown) => failure
			);
	}
	const json =
		(status: number, body: object, headers: Record<string, string> = {}) =>
		() =>
			new Response(JSON.stringify(body), {
				status,
				headers: { 'content-type': 'application/json', ...headers }
			});
	const page = (status: number) => () =>
		new Response('<html>Bad gateway</html>', { status, headers: { 'content-type': 'text/html' } });
	// RFC 6749's own wording of `invalid_grant`, which some providers send as the description.
	const RFC_INVALID_GRANT =
		'The provided authorization grant is invalid, expired, revoked, does not match the redirection URI used in the authorization request, or was issued to another client.';

	it('names the OAuth error, its status and description, and blames the configuration', async () => {
		const failure = await failedExchange(
			json(400, { error: 'unauthorized_client', error_description: 'Grant type not allowed' })
		);

		expect(classifyLoginFailure(failure)).toEqual({
			text: 'unauthorized_client (HTTP 400): Grant type not allowed',
			cause: 'configuration'
		});
	});

	it('reads a wrong client secret from a WWW-Authenticate challenge as well as from the body', async () => {
		const challenged = await failedExchange(
			json(
				401,
				{ error: 'invalid_client' },
				{
					'www-authenticate':
						'Bearer realm="Doorkeeper", error="invalid_client", error_description="Client authentication failed"'
				}
			)
		);
		const bare = await failedExchange(
			json(401, { error: 'invalid_client' }, { 'www-authenticate': 'Basic realm="idp"' })
		);

		expect(classifyLoginFailure(challenged)).toEqual({
			text: 'invalid_client (HTTP 401): Client authentication failed',
			cause: 'configuration'
		});
		expect(classifyLoginFailure(bare)).toEqual({
			text: 'basic challenge (HTTP 401)',
			cause: 'configuration'
		});
		expect(
			classifyLoginFailure(await failedExchange(json(401, { error: 'invalid_client' })))
		).toEqual({
			text: 'invalid_client (HTTP 401)',
			cause: 'configuration'
		});
	});

	it('takes a cancel at the provider or a used code for the login, whatever the description says', async () => {
		const cancelled = await failedExchange(
			json(200, {}),
			'error=access_denied&error_description=User+denied&state=state'
		);
		const used = await failedExchange(
			json(400, { error: 'invalid_grant', error_description: RFC_INVALID_GRANT })
		);

		expect(classifyLoginFailure(cancelled)).toEqual({
			text: 'access_denied: User denied',
			cause: 'login'
		});
		expect(classifyLoginFailure(used)).toEqual({
			text: `invalid_grant (HTTP 400): ${RFC_INVALID_GRANT}`,
			cause: 'login'
		});
	});

	it('takes no connection, a timeout, a server error or a rate limit for a provider that is down', async () => {
		const noConnection = await failedExchange(() => {
			throw new TypeError('fetch failed');
		});
		const timeout = await failedExchange(() => {
			throw new DOMException('The operation timed out.', 'TimeoutError');
		});

		expect(classifyLoginFailure(noConnection)).toEqual({
			text: 'TypeError: fetch failed',
			cause: 'provider'
		});
		expect(classifyLoginFailure(timeout)).toEqual({
			text: 'ClientError: operation timed out',
			cause: 'provider'
		});
		expect(classifyLoginFailure(await failedExchange(page(502)))).toEqual({
			text: 'ClientError: unexpected HTTP response status code (HTTP 502)',
			cause: 'provider'
		});
		expect(
			classifyLoginFailure(await failedExchange(json(503, { error: 'temporarily_unavailable' })))
		).toMatchObject({ cause: 'provider', text: expect.stringContaining('(HTTP 503)') });
		expect(classifyLoginFailure(await failedExchange(page(429)))).toEqual({
			text: 'ClientError: unexpected response content-type (HTTP 429)',
			cause: 'provider'
		});
	});

	it('logs the status of a refusal that is not OAuth, such as a firewall page', async () => {
		expect(classifyLoginFailure(await failedExchange(page(403)))).toEqual({
			text: 'ClientError: unexpected response content-type (HTTP 403)',
			cause: 'login'
		});
	});
});

describe('a failed discovery', () => {
	const PROVIDER: OidcProvider = {
		key: 'gitlab',
		issuer: 'https://gitlab.example.com',
		clientId: 'grimoire',
		clientSecret: 'client-secret',
		label: 'GitLab',
		allowedDomains: [],
		requiredClaims: [],
		redirectUri: 'https://grimoire.example.com/auth/oidc/gitlab/callback'
	};

	afterEach(() => vi.unstubAllGlobals());

	// The warning the login logs when discovery answers with `answer`.
	async function warningFor(answer: () => Response) {
		vi.stubGlobal('fetch', async () => answer());
		const failure = await startFlow(PROVIDER, { next: '' }).then(
			() => expect.unreachable('discovery succeeded'),
			(failure: Error) => failure
		);
		expect(failure).toBeInstanceOf(ProviderUnavailable);
		return unavailableMessage(PROVIDER.key, failure);
	}

	it('names a wrong issuer address or an issuer that names itself differently as configuration', async () => {
		const notFound = await warningFor(() => new Response('Not found', { status: 404 }));
		const otherIssuer = await warningFor(
			() =>
				new Response(
					JSON.stringify({
						issuer: 'https://gitlab.example.com/other',
						authorization_endpoint: 'https://gitlab.example.com/oauth/authorize'
					}),
					{ headers: { 'content-type': 'application/json' } }
				)
		);

		expect(notFound).toBe(
			'OIDC provider gitlab misconfigured: discovery failed: ClientError: unexpected HTTP response status code (HTTP 404); check OIDC_GITLAB_ISSUER'
		);
		expect(otherIssuer).toBe(
			'OIDC provider gitlab misconfigured: discovery failed: ClientError: discovered metadata issuer does not match the expected issuer; check OIDC_GITLAB_ISSUER'
		);
	});

	it('takes an unreachable host or a server error for a provider that is down', async () => {
		const unreachable = await warningFor(() => {
			throw new TypeError('fetch failed');
		});
		const serverError = await warningFor(() => new Response('Bad gateway', { status: 502 }));

		expect(unreachable).toBe(
			'OIDC provider gitlab unavailable: discovery failed: TypeError: fetch failed'
		);
		expect(serverError).toBe(
			'OIDC provider gitlab unavailable: discovery failed: ClientError: unexpected HTTP response status code (HTTP 502)'
		);
	});
});
