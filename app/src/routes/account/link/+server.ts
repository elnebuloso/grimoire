import { error, redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { ENCRYPTION_KEY } from '$app/env/private';
import { database } from '#lib/server/db/index.js';
import { checkCurrentPassword, SESSION_COOKIE, sha256 } from '#lib/server/admin/auth.js';
import { log } from '#lib/server/log.js';
import { providerByKey } from '#lib/server/oidc/index.js';
import { flowCookieOptions, LINK_COOKIE } from '#lib/server/oidc/cookie.js';
import { openLink } from '#lib/server/oidc/flow.js';
import { linkIdentity } from '#lib/server/oidc/identities.js';
import { redirectToProvider } from '#lib/server/oidc/start.js';

/**
 * Starts linking a provider to the account of the session. The current password confirms that the
 * owner asks for it, not someone who found the session open: a link outlives a password change.
 */
export const POST: RequestHandler = async ({ request, cookies, getClientAddress }) => {
	const data = await request.formData();
	const provider = providerByKey(data.get('provider'));
	if (!provider) error(400);
	const session = cookies.get(SESSION_COOKIE)!;
	const db = database();
	const checked = await checkCurrentPassword(
		db,
		getClientAddress(),
		session,
		String(data.get('current') ?? '')
	);
	if ('error' in checked) redirect(303, `/account?problem=${checked.error}`);
	return redirectToProvider(
		provider,
		cookies,
		{ next: '', link: sha256(session) },
		'/account?problem=oidc-unavailable'
	);
};

/**
 * Completes a link the provider confirmed: a request of this site, so the session cookie is there
 * to prove it is the session that started it.
 */
export const GET: RequestHandler = ({ cookies, locals }) => {
	const link = openLink(cookies.get(LINK_COOKIE), ENCRYPTION_KEY.oidcFlows);
	cookies.delete(LINK_COOKIE, flowCookieOptions);
	const session = cookies.get(SESSION_COOKIE);
	if (!link || !session || sha256(session) !== link.session || !locals.user) {
		redirect(303, '/account?problem=oidc-failed');
	}
	const provider = providerByKey(link.provider);
	if (!provider || provider.issuer !== link.issuer) redirect(303, '/account?problem=oidc-failed');
	const refused = linkIdentity(database(), locals.user.id, link.issuer, link.subject, session);
	if (refused) redirect(303, `/account?problem=${refused.error}`);
	log.info(`OIDC provider ${provider.key} linked to an account`);
	redirect(303, `/account?linked=${provider.key}`);
};
