import { fail, redirect } from '@sveltejs/kit';
import type { Actions } from './$types';
import { database } from '#lib/server/db/index.js';
import {
	login,
	SESSION_COOKIE,
	homeOf,
	sessionCookieOptions,
	sessionUser
} from '#lib/server/admin/auth.js';
import { authMessage } from '#lib/server/admin/auth-messages.js';

// A plain form needs no JavaScript; hydrating it would reset what was typed before it finished.
export const csr = false;

export const actions = {
	default: async ({ request, cookies, getClientAddress }) => {
		const data = await request.formData();
		const form = {
			username: String(data.get('username') ?? ''),
			password: String(data.get('password') ?? '')
		};
		const db = database();
		const result = await login(db, getClientAddress(), form);
		if ('error' in result)
			return fail(400, { error: authMessage(result.error), username: form.username });
		cookies.set(SESSION_COOKIE, result.session, sessionCookieOptions);
		redirect(303, homeOf(sessionUser(db, result.session)!));
	}
} satisfies Actions;
