/**
 * Only a path on this site: anything else would make a redirect after a switch an open redirect.
 * Resolved the way a browser does, which reads `/\host` and `/<tab>/host` like `//host`; a resolved
 * path can itself start with `//` (from `/.//host`), which a browser reads as another host again.
 */
export function pathOnThisSite(target: string, url: URL): string {
	const resolved = URL.parse(target, url);
	if (resolved?.origin !== url.origin || resolved.pathname.startsWith('//')) return '/';
	return resolved.pathname + resolved.search + resolved.hash;
}
