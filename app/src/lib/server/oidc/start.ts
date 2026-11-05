import { redirect, type Cookies } from '@sveltejs/kit';
import { ENCRYPTION_KEY } from '$app/env/private';
import { log } from '#lib/server/log.js';
import type { OidcProvider } from './config.js';
import { FLOW_COOKIE, flowCookieOptions } from './cookie.js';
import { sealFlow, startFlow, unavailableMessage, type OidcFlow } from './flow.js';

/**
 * Sends the browser to `provider` to log in, keeping the flow in its cookie. A provider that
 * cannot be reached sends it to `unavailable` instead.
 */
export async function redirectToProvider(
	provider: OidcProvider,
	cookies: Cookies,
	options: Pick<OidcFlow, 'next' | 'invite' | 'link'>,
	unavailable: string
): Promise<never> {
	let started;
	try {
		started = await startFlow(provider, options);
	} catch (failure) {
		log.warn(unavailableMessage(provider.key, failure as Error));
		redirect(303, unavailable);
	}
	cookies.set(FLOW_COOKIE, sealFlow(started.flow, ENCRYPTION_KEY.oidcFlows), flowCookieOptions);
	// To the provider's authorization endpoint, which discovery named; nowhere else off this site.
	redirect(303, started.url.href, { external: [started.url.origin] });
}
