import { error, fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { database } from '#lib/server/db/index.js';
import { resetLinkValid, resetPassword } from '#lib/server/admin/password-reset.js';
import { authMessage } from '#lib/server/admin/auth-messages.js';
import { mailer } from '#lib/server/mail/index.js';

// A plain form needs no JavaScript; hydrating it would reset what was typed before it finished.
export const csr = false;

export const load: PageServerLoad = ({ params, setHeaders }) => {
	if (!mailer()) error(404);
	// The token is in the URL; a link to another site must not carry it along. Not `no-referrer`:
	// with it the browser sends the form with `Origin: null`, which the CSRF check refuses.
	setHeaders({ 'referrer-policy': 'same-origin' });
	return { valid: resetLinkValid(database(), params.token) };
};

export const actions = {
	default: async ({ request, params }) => {
		if (!mailer()) error(404);
		const password = String((await request.formData()).get('password') ?? '');
		const refused = await resetPassword(database(), params.token, password);
		if (refused) {
			return fail(400, {
				error: authMessage(refused.error),
				linkInvalid: refused.error === 'reset-link-invalid'
			});
		}
		return { done: true };
	}
} satisfies Actions;
