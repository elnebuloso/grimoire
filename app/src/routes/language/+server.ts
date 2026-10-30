import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { cookieMaxAge, cookieName, isLocale } from '#lib/paraglide/runtime.js';
import { pathOnThisSite } from '#lib/server/path-on-this-site.js';

// Stores the language picked with the switch and goes back to the page it was picked on.
export const POST: RequestHandler = async ({ request, cookies, url }) => {
	const data = await request.formData();
	const locale = String(data.get('locale') ?? '');
	if (isLocale(locale)) {
		// Readable by scripts: Paraglide's runtime in the browser reads the language from it.
		cookies.set(cookieName, locale, {
			path: '/',
			maxAge: cookieMaxAge,
			httpOnly: false,
			sameSite: 'lax'
		});
	}
	redirect(303, pathOnThisSite(String(data.get('redirectTo') ?? '/'), url));
};
