import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { database } from '#lib/server/db/index.js';
import { changePassword, hasPassword, SESSION_COOKIE } from '#lib/server/admin/auth.js';
import { mailer } from '#lib/server/mail/index.js';
import { authMessage } from '#lib/server/admin/auth-messages.js';

export const load: PageServerLoad = ({ locals }) => ({
	email: locals.user?.email,
	hasPassword: locals.user !== undefined && hasPassword(database(), locals.user.id),
	resetByMail: mailer() !== undefined
});

export const actions = {
	default: async ({ request, cookies, getClientAddress }) => {
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
	}
} satisfies Actions;
