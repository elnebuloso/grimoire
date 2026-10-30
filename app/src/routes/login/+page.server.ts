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
import { authMessage } from '#lib/server/admin/auth-messages.js';
import { mailer } from '#lib/server/mail/index.js';

// A plain form needs no JavaScript; hydrating it would reset what was typed before it finished.
export const csr = false;

export const load: PageServerLoad = () => ({ resetByMail: mailer() !== undefined });

export const actions = {
	default: async ({ request, cookies, getClientAddress }) => {
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
		redirect(303, homeOf(sessionUser(db, result.session)!));
	}
} satisfies Actions;
