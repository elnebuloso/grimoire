export type Area = 'start' | 'account' | 'manage';

/** The area of the app frame a path belongs to. */
export function areaOf(pathname: string): Area {
	const under = (prefix: string) => pathname === prefix || pathname.startsWith(`${prefix}/`);
	if (under('/manage')) return 'manage';
	if (under('/account')) return 'account';
	return 'start';
}
