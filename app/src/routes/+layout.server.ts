import type { LayoutServerLoad } from './$types';
import { GRIMOIRE_VERSION, INSTANCE_TITLE, TZ } from '$app/env/private';
import { mayOpen } from '#lib/server/auth/access.js';
import { isTheme, THEME_COOKIE } from '#lib/theme.js';

export const load: LayoutServerLoad = ({ cookies, locals }) => {
	const { user } = locals;
	const theme = cookies.get(THEME_COOKIE);
	return {
		// The header links only to pages the user may open.
		user: user && {
			name: user.email,
			mayManage: mayOpen(user, '/manage')
		},
		// Every page formats times in it, also after hydration in a browser in another zone.
		timeZone: TZ,
		// What the theme switch shows as picked; the page itself gets it from the server hook.
		theme: isTheme(theme) ? theme : ('system' as const),
		instanceTitle: INSTANCE_TITLE,
		version: GRIMOIRE_VERSION
	};
};
