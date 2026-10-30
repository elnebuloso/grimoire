import { fail, redirect } from '@sveltejs/kit';
import type { Actions } from './$types';
import { database } from '#lib/server/db/index.js';
import { login, setupAdmin, SESSION_COOKIE, sessionCookieOptions } from '#lib/server/admin/auth.js';
import { authMessage } from '#lib/server/admin/auth-messages.js';

// A plain form needs no JavaScript; hydrating it would reset what was typed before it finished.
export const csr = false;

export const actions = {
	default: async ({ request, cookies, getClientAddress }) => {
		const data = await request.formData();
		const form = {
			token: String(data.get('token') ?? ''),
			username: String(data.get('username') ?? ''),
			password: String(data.get('password') ?? '')
		};
		const db = database();
		const problem = await setupAdmin(db, form);
		if (problem) return fail(400, { error: authMessage(problem), username: form.username });
		const result = await login(db, getClientAddress(), form);
		if ('session' in result) cookies.set(SESSION_COOKIE, result.session, sessionCookieOptions);
		redirect(303, '/manage');
	}
} satisfies Actions;
