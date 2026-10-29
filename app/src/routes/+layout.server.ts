import type { LayoutServerLoad } from './$types';
import { TZ } from '$app/env/private';
import { database } from '#lib/server/db/index.js';
import { adminUsername, SESSION_COOKIE, sessionValid } from '#lib/server/admin/auth.js';

export const load: LayoutServerLoad = ({ cookies }) => {
	const db = database();
	return {
		admin: sessionValid(db, cookies.get(SESSION_COOKIE)) ? adminUsername(db) : undefined,
		// Every page formats times in it, also after hydration in a browser in another zone.
		timeZone: TZ
	};
};
