import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { database } from '#lib/server/db/index.js';
import { changePassword, hasPassword, SESSION_COOKIE } from '#lib/server/admin/auth.js';
import { mailer } from '#lib/server/mail/index.js';
import { authMessage, isAuthProblem } from '#lib/server/admin/auth-messages.js';
import { describeLinks, oidcProviders, providerByKey } from '#lib/server/oidc/index.js';
import { linkedIssuers, unlinkIdentity } from '#lib/server/oidc/identities.js';

export const load: PageServerLoad = ({ locals, url }) => {
	const user = locals.user!;
	const db = database();
	const providers = oidcProviders();
	const issuers = linkedIssuers(db, user.id);
	// Set on the way back from linking a provider.
	const problem = url.searchParams.get('problem');
	const linked = providerByKey(url.searchParams.get('linked'));
	return {
		email: user.email,
		hasPassword: hasPassword(db, user.id),
		resetByMail: mailer() !== undefined,
		links: describeLinks(issuers),
		linkable: providers
			.filter((provider) => !issuers.includes(provider.issuer))
			.map(({ key, label }) => ({ key, label })),
		problem: isAuthProblem(problem) ? authMessage(problem) : undefined,
		linked: linked?.label
	};
};

export const actions = {
	password: async ({ request, cookies, getClientAddress }) => {
		const data = await request.formData();
		const refused = await changePassword(
			database(),
			getClientAddress(),
			cookies.get(SESSION_COOKIE)!,
			{
				current: String(data.get('current') ?? ''),
				password: String(data.get('password') ?? '')
			}
		);
		if (refused) return fail(400, { error: authMessage(refused.error) });
		return { changed: true };
	},
	/** Removes a link of the own account; the other sessions end, since one of them may be the reason. */
	unlink: async ({ request, cookies, locals }) => {
		const issuer = String((await request.formData()).get('issuer') ?? '');
		const configured = oidcProviders().map((provider) => provider.issuer);
		const refused = unlinkIdentity(
			database(),
			locals.user!.id,
			issuer,
			configured,
			cookies.get(SESSION_COOKIE)
		);
		if (refused) return fail(400, { problem: authMessage(refused.error) });
		return { unlinked: true };
	}
} satisfies Actions;
