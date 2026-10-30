import { BASE_URL } from '$app/env/private';
import { log } from './log.js';

/**
 * The origin absolute links point to: `baseUrl` when set, otherwise the one the request arrived
 * at. A request arriving at another origin than `baseUrl` is logged once: links then lead
 * somewhere else than the browser is, and a form opened there fails the cross-site check.
 */
export function createPublicOrigin(baseUrl: string): (url: URL) => string {
	let warned = false;
	return (url) => {
		if (!baseUrl) return url.origin;
		if (url.origin !== baseUrl && !warned) {
			warned = true;
			log.warn(
				`A request arrived at ${url.origin}, but BASE_URL is ${baseUrl}; links point to BASE_URL`
			);
		}
		return baseUrl;
	};
}

export const publicOrigin = createPublicOrigin(BASE_URL);
