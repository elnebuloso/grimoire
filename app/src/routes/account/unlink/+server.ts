import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { database } from '#lib/server/db/index.js';
import { SESSION_COOKIE } from '#lib/server/admin/auth.js';
import { oidcProviders } from '#lib/server/oidc/index.js';
import { unlinkIdentity } from '#lib/server/oidc/identities.js';

/** Removes a link of the own account; the other sessions end, since one of them may be the reason. */
export const POST: RequestHandler = async ({ request, cookies, locals }) => {
	const issuer = String((await request.formData()).get('issuer') ?? '');
	const configured = oidcProviders().map((provider) => provider.issuer);
	const refused = unlinkIdentity(
		database(),
		locals.user!.id,
		issuer,
		configured,
		cookies.get(SESSION_COOKIE)
	);
	redirect(303, refused ? `/account?problem=${refused.error}` : '/account?unlinked=1');
};
