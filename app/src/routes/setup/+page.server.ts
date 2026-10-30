import { error, fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { database } from '#lib/server/db/index.js';
import { login, setupAdmin, SESSION_COOKIE, sessionCookieOptions } from '#lib/server/admin/auth.js';
import { authMessage } from '#lib/server/admin/auth-messages.js';

// A plain form needs no JavaScript; hydrating it would reset what was typed before it finished.
export const csr = false;

// The access hook decides; thrown here, the error renders in the layout.
export const load: PageServerLoad = ({ locals }) => {
	if (locals.accessDenied) error(locals.accessDenied);
};

export const actions = {
	default: async ({ request, cookies, getClientAddress }) => {
		const data = await request.formData();
		const form = {
			token: String(data.get('token') ?? ''),
			email: String(data.get('email') ?? ''),
			password: String(data.get('password') ?? '')
		};
		const db = database();
		const refused = await setupAdmin(db, form);
		if (refused) return fail(400, { error: authMessage(refused.error), email: form.email });
		const result = await login(db, getClientAddress(), form);
		if ('session' in result) cookies.set(SESSION_COOKIE, result.session, sessionCookieOptions);
		redirect(303, '/manage');
	}
} satisfies Actions;
