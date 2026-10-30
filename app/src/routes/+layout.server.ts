import type { LayoutServerLoad } from './$types';
import { TZ } from '$app/env/private';
import { database } from '#lib/server/db/index.js';
import { mayOpen, SESSION_COOKIE, sessionUser } from '#lib/server/admin/auth.js';

export const load: LayoutServerLoad = ({ cookies }) => {
	const user = sessionUser(database(), cookies.get(SESSION_COOKIE));
	return {
		// The header links only to pages the user may open.
		user: user && { name: user.username, mayManage: mayOpen(user, '/manage') },
		// Every page formats times in it, also after hydration in a browser in another zone.
		timeZone: TZ
	};
};
