import { error, redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { database } from '#lib/server/db/index.js';
import { deleteSession, SESSION_COOKIE, sessionCookieOptions } from '#lib/server/admin/auth.js';
import { invitedEmail } from '#lib/server/admin/invitations.js';
import { providerByKey } from '#lib/server/oidc/index.js';
import { redirectToProvider } from '#lib/server/oidc/start.js';
import { pathOnThisSite } from '#lib/server/path-on-this-site.js';

// Started by a form, never by a link: a page elsewhere must not be able to start a login here.
export const POST: RequestHandler = async ({ params, request, cookies, url }) => {
	const provider = providerByKey(params.key);
	if (!provider) error(404);
	const data = await request.formData();
	const next = String(data.get('next') ?? '');
	const invite = String(data.get('invite') ?? '') || undefined;
	if (invite && !invitedEmail(database(), invite))
		redirect(303, '/login?problem=invite-link-invalid');
	// Whoever logs in through a provider becomes whoever the provider says, not the user before.
	const session = cookies.get(SESSION_COOKIE);
	if (session) {
		deleteSession(database(), session);
		cookies.delete(SESSION_COOKIE, sessionCookieOptions);
	}
	return redirectToProvider(
		provider,
		cookies,
		{ next: next ? pathOnThisSite(next, url) : '', invite },
		'/login?problem=oidc-unavailable'
	);
};
