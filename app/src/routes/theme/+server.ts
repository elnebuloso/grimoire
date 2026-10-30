import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { pathOnThisSite } from '#lib/server/path-on-this-site.js';
import { isTheme, THEME_COOKIE } from '#lib/theme.js';

// 400 days, the longest a browser keeps a cookie.
const THEME_COOKIE_MAX_AGE = 400 * 24 * 60 * 60;

// Stores the scheme picked with the switch, or forgets it for "System", and goes back.
export const POST: RequestHandler = async ({ request, cookies, url }) => {
	const data = await request.formData();
	const theme = data.get('theme');
	if (isTheme(theme)) {
		cookies.set(THEME_COOKIE, theme, {
			path: '/',
			maxAge: THEME_COOKIE_MAX_AGE,
			httpOnly: true,
			sameSite: 'lax'
		});
	} else if (theme === 'system') {
		cookies.delete(THEME_COOKIE, { path: '/' });
	}
	redirect(303, pathOnThisSite(String(data.get('redirectTo') ?? '/'), url));
};
