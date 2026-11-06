import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { database } from '#lib/server/db/index.js';
import { WELCOME_PAGE } from '#lib/server/admin/access.js';
import {
	createSession,
	MIN_PASSWORD_LENGTH,
	SESSION_COOKIE,
	sessionCookieOptions
} from '#lib/server/admin/auth.js';
import { authRefusal } from '#lib/server/admin/auth-messages.js';
import { acceptInvitation, invitedEmail } from '#lib/server/admin/invitations.js';
import { oidcProviders } from '#lib/server/oidc/index.js';

// A plain form needs no JavaScript; hydrating it would reset what was typed before it finished.
export const csr = false;

export const load: PageServerLoad = ({ params, setHeaders }) => {
	// The token is in the URL; a link to another site must not carry it along. Not `no-referrer`:
	// with it the browser sends the form with `Origin: null`, which the CSRF check refuses.
	setHeaders({ 'referrer-policy': 'same-origin' });
	return {
		email: invitedEmail(database(), params.token),
		providers: oidcProviders().map(({ key, label }) => ({ key, label })),
		// Sent along by the provider buttons: holding the link is what proves the invitation.
		token: params.token,
		minPasswordLength: MIN_PASSWORD_LENGTH
	};
};

export const actions = {
	default: async ({ request, params, cookies }) => {
		const password = String((await request.formData()).get('password') ?? '');
		const db = database();
		const accepted = await acceptInvitation(db, params.token, password);
		if ('error' in accepted) {
			return fail(400, {
				...authRefusal(accepted.error),
				linkInvalid: accepted.error !== 'password-too-short'
			});
		}
		cookies.set(
			SESSION_COOKIE,
			createSession(db, accepted.userId, new Date()),
			sessionCookieOptions
		);
		redirect(303, WELCOME_PAGE);
	}
} satisfies Actions;
