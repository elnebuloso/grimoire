import { error, redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { database } from '#lib/server/db/index.js';
import { SESSION_COOKIE } from '#lib/server/auth/auth.js';
import { sha256 } from '#lib/server/sha256.js';
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
	// Whoever logs in through a provider becomes whoever the provider says, not the user before:
	// the session of this browser ends, but only once that login succeeded, not on a cancel.
	const session = cookies.get(SESSION_COOKIE);
	return redirectToProvider(
		provider,
		cookies,
		{
			next: next ? pathOnThisSite(next, url) : '',
			invite,
			replaces: session ? sha256(session) : undefined
		},
		'/login'
	);
};
