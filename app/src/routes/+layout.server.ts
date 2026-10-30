import type { LayoutServerLoad } from './$types';
import { GRIMOIRE_VERSION, INSTANCE_NAME, TZ } from '$app/env/private';
import { database } from '#lib/server/db/index.js';
import { mayOpen } from '#lib/server/admin/access.js';
import { SESSION_COOKIE, sessionUser } from '#lib/server/admin/auth.js';
import { isTheme, THEME_COOKIE } from '#lib/theme.js';

export const load: LayoutServerLoad = ({ cookies }) => {
	const user = sessionUser(database(), cookies.get(SESSION_COOKIE));
	const theme = cookies.get(THEME_COOKIE);
	return {
		// The header links only to pages the user may open.
		user: user && { name: user.email, mayManage: mayOpen(user, '/manage') },
		// Every page formats times in it, also after hydration in a browser in another zone.
		timeZone: TZ,
		// What the theme switch shows as picked; the page itself gets it from the server hook.
		theme: isTheme(theme) ? theme : 'system',
		instanceName: INSTANCE_NAME,
		version: GRIMOIRE_VERSION
	};
};
