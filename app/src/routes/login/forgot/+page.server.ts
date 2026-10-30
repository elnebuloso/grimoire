import { error, fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { database } from '#lib/server/db/index.js';
import { requestPasswordReset } from '#lib/server/admin/password-reset.js';
import { authMessage } from '#lib/server/admin/auth-messages.js';
import { mailer } from '#lib/server/mail/index.js';
import { m } from '#lib/paraglide/messages.js';

// A plain form needs no JavaScript; hydrating it would reset what was typed before it finished.
export const csr = false;

// Without SMTP there is no way to send the link, so the page does not exist.
export const load: PageServerLoad = () => {
	if (!mailer()) error(404);
};

export const actions = {
	default: async ({ request, getClientAddress }) => {
		const mail = mailer();
		if (!mail) error(404);
		const email = String((await request.formData()).get('email') ?? '');
		const result = requestPasswordReset(database(), getClientAddress(), email);
		if (result && 'error' in result) {
			return fail(429, { error: authMessage(result.error), email });
		}
		if (result) {
			const url = mail.link(`/login/reset/${result.token}`);
			// Not awaited: the answer must not take longer for an address that has an account.
			void mail.send({
				to: result.to,
				subject: m.mail_reset_subject(),
				text: m.mail_reset_text({ email: result.to, url })
			});
		}
		return { sent: true };
	}
} satisfies Actions;
