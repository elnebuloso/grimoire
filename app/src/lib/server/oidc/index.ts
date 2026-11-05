import { BASE_URL, OIDC_PROVIDERS } from '$app/env/private';
import { logAlways } from '#lib/server/log.js';
import { parseOidcProviders, type OidcProvider } from './config.js';

export type { OidcProvider } from './config.js';

let configured: OidcProvider[] | undefined;

/**
 * The identity providers of this instance. Their settings come from the environment of the
 * process, not from `defineEnvVars`: their names depend on the keys in `OIDC_PROVIDERS`.
 */
export function oidcProviders(): OidcProvider[] {
	configured ??= parseOidcProviders(OIDC_PROVIDERS, process.env, BASE_URL);
	return configured;
}

/** The provider `key` names, such as from a route parameter or a form field; undefined for none. */
export function providerByKey(key: unknown): OidcProvider | undefined {
	return oidcProviders().find((provider) => provider.key === key);
}

export function providerByIssuer(issuer: string): OidcProvider | undefined {
	return oidcProviders().find((provider) => provider.issuer === issuer);
}

/**
 * A user's links as the pages show them. A link to a provider no longer configured is listed by its
 * issuer, so it can be removed.
 */
export function describeLinks(issuers: string[]) {
	return issuers.map((issuer) => {
		const provider = providerByIssuer(issuer);
		return { issuer, label: provider?.label ?? issuer, configured: provider !== undefined };
	});
}

/** Checks the providers at start and names the redirect URI each must have registered. */
export function checkOidcProviders() {
	for (const provider of oidcProviders()) {
		logAlways(`OIDC provider ${provider.key}: register the redirect URI ${provider.redirectUri}`);
	}
}
