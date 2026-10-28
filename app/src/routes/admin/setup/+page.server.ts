import { fail, redirect } from '@sveltejs/kit';
import type { Actions } from './$types';
import { database } from '#lib/server/db/index.js';
import { login, setupAdmin, SESSION_COOKIE, sessionCookieOptions } from '#lib/server/admin/auth.js';

export const actions = {
	default: async ({ request, cookies, getClientAddress }) => {
		const data = await request.formData();
		const form = {
			token: String(data.get('token') ?? ''),
			username: String(data.get('username') ?? ''),
			password: String(data.get('password') ?? '')
		};
		const db = database();
		const problem = setupAdmin(db, form);
		if (problem) return fail(400, { error: problem, username: form.username });
		const result = login(db, getClientAddress(), form);
		if ('session' in result) cookies.set(SESSION_COOKIE, result.session, sessionCookieOptions);
		redirect(303, '/admin');
	}
} satisfies Actions;
