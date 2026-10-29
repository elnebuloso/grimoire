import type { LayoutServerLoad } from './$types';
import { TZ } from '$app/env/private';
import { database } from '#lib/server/db/index.js';
import { SESSION_COOKIE, sessionUser } from '#lib/server/admin/auth.js';

export const load: LayoutServerLoad = ({ cookies }) => {
	const db = database();
	return {
		user: sessionUser(db, cookies.get(SESSION_COOKIE))?.username,
		// Every page formats times in it, also after hydration in a browser in another zone.
		timeZone: TZ
	};
};
