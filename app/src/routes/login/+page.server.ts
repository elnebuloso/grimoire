import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { database } from '#lib/server/db/index.js';
import { homeOf } from '#lib/server/admin/access.js';
import {
	login,
	SESSION_COOKIE,
	sessionCookieOptions,
	sessionUser
} from '#lib/server/admin/auth.js';
import { authMessage, isAuthProblem } from '#lib/server/admin/auth-messages.js';
import { oidcProviders } from '#lib/server/oidc/index.js';
import { mailer } from '#lib/server/mail/index.js';
import { pathOnThisSite } from '#lib/server/path-on-this-site.js';

// A plain form needs no JavaScript; hydrating it would reset what was typed before it finished.
export const csr = false;

export const load: PageServerLoad = ({ url }) => {
	// Set by a login through an identity provider that was refused, on its way back here.
	const problem = url.searchParams.get('problem');
	return {
		resetByMail: mailer() !== undefined,
		providers: oidcProviders().map(({ key, label }) => ({ key, label })),
		next: url.searchParams.get('next') ?? '',
		problem: isAuthProblem(problem) ? authMessage(problem) : undefined,
		// Set by an import on the setup page.
		imported: url.searchParams.has('imported')
	};
};

export const actions = {
	default: async ({ request, cookies, getClientAddress, url }) => {
		const data = await request.formData();
		const form = {
			email: String(data.get('email') ?? ''),
			password: String(data.get('password') ?? '')
		};
		const db = database();
		const result = await login(db, getClientAddress(), form);
		if ('error' in result)
			return fail(400, { error: authMessage(result.error), email: form.email });
		cookies.set(SESSION_COOKIE, result.session, sessionCookieOptions);
		// Back to the page whose request found the session ended, else where the user works.
		const next = url.searchParams.get('next');
		redirect(303, next ? pathOnThisSite(next, url) : homeOf(sessionUser(db, result.session)!));
	}
} satisfies Actions;
