import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { cookieMaxAge, cookieName, isLocale } from '#lib/paraglide/runtime.js';

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

// Only a path on this site: anything else would make the switch an open redirect. Resolved the
// way a browser does, which reads `/\host` and `/<tab>/host` like `//host`; a resolved path can
// itself start with `//` (from `/.//host`), which a browser reads as another host again.
function pathOnThisSite(target: string, url: URL): string {
	const resolved = URL.parse(target, url);
	if (resolved?.origin !== url.origin || resolved.pathname.startsWith('//')) return '/';
	return resolved.pathname + resolved.search + resolved.hash;
}
