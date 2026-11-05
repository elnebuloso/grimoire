import * as client from 'openid-client';
import { decryptSecret, encryptSecret } from '../secret-encryption.ts';
import type { OidcProvider } from './config.ts';

/** How long a user may take at the provider before the login has to start again. */
const FLOW_MINUTES = 10;
// Discovery is fetched again after this, so a provider's changed endpoints are picked up.
const DISCOVERY_HOURS = 24;
const REQUEST_TIMEOUT_SECONDS = 10;

/** What a login carries in a cookie from its start until the provider sends the user back. */
export interface OidcFlow {
	provider: string;
	verifier: string;
	state: string;
	nonce: string;
	/** Where the user goes once logged in; a path on this site. */
	next: string;
	/** The token of the invitation the login accepts; holding the link proves the invitation. */
	invite?: string;
	/** The hash of the session that links the identity to its user, instead of logging in. */
	link?: string;
	expiresAt: string;
}

/** The provider could not be reached or answered with nonsense; worth another try later. */
export class ProviderUnavailable extends Error {}

/** The provider cannot be used until the operator fixes its settings; trying later will not help. */
export class ProviderMisconfigured extends ProviderUnavailable {}

/** The warning for a provider that cannot be used now. */
export function unavailableMessage(key: string, failure: Error): string {
	const state = failure instanceof ProviderMisconfigured ? 'misconfigured' : 'unavailable';
	return `OIDC provider ${key} ${state}: ${failure.message}`;
}

const configurations = new Map<string, { config: client.Configuration; fetchedAt: number }>();

// Fetched on first use, not at start: a provider that is down must not keep grimoire from starting.
// Only a successful discovery is kept, so the next login retries one that failed.
async function configurationOf(provider: OidcProvider, now: Date): Promise<client.Configuration> {
	const cached = configurations.get(provider.key);
	if (cached && now.getTime() - cached.fetchedAt < DISCOVERY_HOURS * 3_600_000)
		return cached.config;
	const local = new URL(provider.issuer).protocol === 'http:';
	try {
		const config = await client.discovery(
			new URL(provider.issuer),
			provider.clientId,
			provider.clientSecret,
			undefined,
			{
				timeout: REQUEST_TIMEOUT_SECONDS,
				// Only issuers on localhost may use http; the configuration refuses any other.
				execute: local ? [client.allowInsecureRequests] : []
			}
		);
		configurations.set(provider.key, { config, fetchedAt: now.getTime() });
		return config;
	} catch (error) {
		const { text, cause } = classifyLoginFailure(error);
		if (cause === 'provider') {
			throw new ProviderUnavailable(`discovery failed: ${text}`, { cause: error });
		}
		// A wrong address or an issuer that names itself differently: the setting, not the network.
		const variable = `OIDC_${provider.key.toUpperCase()}_ISSUER`;
		throw new ProviderMisconfigured(`discovery failed: ${text}; check ${variable}`, {
			cause: error
		});
	}
}

/** Starts a login at `provider`: the URL to send the browser to, and the flow to keep meanwhile. */
export async function startFlow(
	provider: OidcProvider,
	{ next, invite, link }: Pick<OidcFlow, 'next' | 'invite' | 'link'>,
	now = new Date()
): Promise<{ url: URL; flow: OidcFlow }> {
	const config = await configurationOf(provider, now);
	const flow: OidcFlow = {
		provider: provider.key,
		verifier: client.randomPKCECodeVerifier(),
		state: client.randomState(),
		nonce: client.randomNonce(),
		next,
		invite,
		link,
		expiresAt: new Date(now.getTime() + FLOW_MINUTES * 60_000).toISOString()
	};
	const url = client.buildAuthorizationUrl(config, {
		redirect_uri: provider.redirectUri,
		scope: 'openid email',
		code_challenge: await client.calculatePKCECodeChallenge(flow.verifier),
		code_challenge_method: 'S256',
		state: flow.state,
		nonce: flow.nonce
	});
	return { url, flow };
}

/**
 * Exchanges the code the provider sent back for a validated ID token and returns its claims.
 * Throws when anything does not match the flow: state, nonce, PKCE verifier, issuer, audience,
 * signature or expiry.
 */
export async function finishFlow(
	provider: OidcProvider,
	query: URLSearchParams,
	flow: OidcFlow,
	now = new Date()
): Promise<Record<string, unknown>> {
	const config = await configurationOf(provider, now);
	// The registered redirect URI, not the URL of the request: behind a proxy they can differ, and
	// the code exchange must name the one the provider knows.
	const callback = new URL(provider.redirectUri);
	callback.search = query.toString();
	try {
		const tokens = await client.authorizationCodeGrant(config, callback, {
			pkceCodeVerifier: flow.verifier,
			expectedState: flow.state,
			expectedNonce: flow.nonce,
			idTokenExpected: true
		});
		return { ...tokens.claims() };
	} catch (failure) {
		const { text, cause } = classifyLoginFailure(failure);
		if (cause === 'provider') {
			throw new ProviderUnavailable(`token request failed: ${text}`, { cause: failure });
		}
		throw failure;
	}
}

// OAuth errors whose cause is the registration at the provider or the settings here, not the user.
const CONFIGURATION_ERRORS = ['invalid_client', 'unauthorized_client'];
// A provider that rate-limits answers with 429; like a 5xx, a later try may succeed.
const isUnavailableStatus = (status: number) => status >= 500 || status === 429;

/**
 * What the log says about a failed login, without the client secret: the OAuth error with its HTTP
 * status and description where the provider sent them. `cause` tells a provider that is down
 * (another try later may succeed), a configuration error the operator must fix, and everything
 * else, such as a user who cancelled at the provider.
 */
export function classifyLoginFailure(failure: unknown): {
	text: string;
	cause: 'provider' | 'configuration' | 'login';
} {
	const oauth = oauthError(failure);
	if (oauth) {
		const { error, description, status } = oauth;
		const text = `${error}${status ? ` (HTTP ${status})` : ''}${description ? `: ${description}` : ''}`;
		if (status !== undefined && isUnavailableStatus(status)) return { text, cause: 'provider' };
		// RFC 6749 answers only a failed client authentication with 401, whatever the error says.
		const misconfigured = CONFIGURATION_ERRORS.includes(error) || status === 401;
		return { text, cause: misconfigured ? 'configuration' : 'login' };
	}
	const error = failure as Error;
	const response =
		error instanceof client.ClientError && error.cause instanceof Response
			? error.cause
			: undefined;
	const text = `${error.name}: ${error.message}${response ? ` (HTTP ${response.status})` : ''}`;
	// fetch rejects with a TypeError when there is no connection; openid-client turns a timeout
	// into a ClientError of its own.
	const unreachable =
		error instanceof TypeError ||
		(error instanceof client.ClientError && error.code === 'OAUTH_TIMEOUT');
	const unavailable =
		unreachable || (response !== undefined && isUnavailableStatus(response.status));
	return { text, cause: unavailable ? 'provider' : 'login' };
}

// The OAuth error of a failure, wherever openid-client put it: the response body, the redirect
// back from the provider, or a `WWW-Authenticate` challenge, which it reads before the body.
function oauthError(
	failure: unknown
): { error: string; description?: string; status?: number } | undefined {
	if (failure instanceof client.ResponseBodyError) {
		return { error: failure.error, description: failure.error_description, status: failure.status };
	}
	if (failure instanceof client.AuthorizationResponseError) {
		return { error: failure.error, description: failure.error_description };
	}
	if (failure instanceof client.WWWAuthenticateChallengeError) {
		const challenge = failure.cause.find(({ parameters }) => parameters.error) ?? failure.cause[0];
		const { error, error_description } = challenge?.parameters ?? {};
		return {
			error: error ?? `${challenge?.scheme ?? 'unknown'} challenge`,
			description: error_description,
			status: failure.status
		};
	}
	return undefined;
}

/** The flow encrypted for its cookie. */
export function sealFlow(flow: OidcFlow, key: Buffer): string {
	return encryptSecret(JSON.stringify(flow), key);
}

/** Why a callback has no flow to finish; the log names it. */
export type FlowProblem = 'missing' | 'unreadable' | 'for another provider' | 'expired';

/** The flow of the cookie, if it is intact, unexpired and for `provider`; otherwise why not. */
export function openFlow(
	sealed: string | undefined,
	provider: string,
	key: Buffer,
	now = new Date()
): { flow: OidcFlow } | { problem: FlowProblem } {
	if (!sealed) return { problem: 'missing' };
	let flow: OidcFlow;
	try {
		flow = JSON.parse(decryptSecret(sealed, key)) as OidcFlow;
	} catch {
		return { problem: 'unreadable' };
	}
	if (flow.provider !== provider) return { problem: 'for another provider' };
	if (flow.expiresAt <= now.toISOString()) return { problem: 'expired' };
	return { flow };
}

/** An identity the provider confirmed, waiting for the session that asked to link it. */
export interface PendingLink {
	provider: string;
	issuer: string;
	subject: string;
	/** The hash of the session that started the link. */
	session: string;
	expiresAt: string;
}

export function sealLink(link: PendingLink, key: Buffer): string {
	return encryptSecret(JSON.stringify(link), key);
}

/** The pending link of the cookie, if it is intact and unexpired; undefined otherwise. */
export function openLink(
	sealed: string | undefined,
	key: Buffer,
	now = new Date()
): PendingLink | undefined {
	if (!sealed) return undefined;
	try {
		const link = JSON.parse(decryptSecret(sealed, key)) as PendingLink;
		return link.session && link.expiresAt > now.toISOString() ? link : undefined;
	} catch {
		return undefined;
	}
}
