import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { database } from '#lib/server/db/index.js';
import { changePassword, SESSION_COOKIE, sessionUser } from '#lib/server/admin/auth.js';
import { authMessage } from '#lib/server/admin/auth-messages.js';

export const load: PageServerLoad = ({ cookies }) => ({
	email: sessionUser(database(), cookies.get(SESSION_COOKIE))?.email
});

export const actions = {
	default: async ({ request, cookies, getClientAddress }) => {
		const data = await request.formData();
		const problem = await changePassword(
			database(),
			getClientAddress(),
			cookies.get(SESSION_COOKIE)!,
			{
				current: String(data.get('current') ?? ''),
				password: String(data.get('password') ?? '')
			}
		);
		if (problem) return fail(400, { error: authMessage(problem) });
		return { changed: true };
	}
} satisfies Actions;
