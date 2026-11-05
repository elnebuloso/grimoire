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

/** Checks the providers at start and names the redirect URI each must have registered. */
export function checkOidcProviders() {
	for (const provider of oidcProviders()) {
		logAlways(`OIDC provider ${provider.key}: register the redirect URI ${provider.redirectUri}`);
	}
}
