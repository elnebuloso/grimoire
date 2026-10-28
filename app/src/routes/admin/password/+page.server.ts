import { fail } from '@sveltejs/kit';
import type { Actions } from './$types';
import { database } from '#lib/server/db/index.js';
import { changePassword, SESSION_COOKIE } from '#lib/server/admin/auth.js';

export const actions = {
	default: async ({ request, cookies, getClientAddress }) => {
		const data = await request.formData();
		const problem = changePassword(database(), getClientAddress(), cookies.get(SESSION_COOKIE)!, {
			current: String(data.get('current') ?? ''),
			password: String(data.get('password') ?? '')
		});
		if (problem) return fail(400, { error: problem });
		return { changed: true };
	}
} satisfies Actions;
