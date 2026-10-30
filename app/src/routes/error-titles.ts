import { m } from '#lib/paraglide/messages.js';

/**
 * The heading of the error page and the shorter name of its browser tab. An unexpected error
 * shows neither its message nor its status: either can name internals.
 */
export function errorTitles(status: number): { heading: string; documentTitle: string } {
	if (status === 404) {
		return { heading: m.error_not_found(), documentTitle: m.error_title_not_found() };
	}
	if (status === 403) {
		return { heading: m.error_forbidden(), documentTitle: m.error_title_forbidden() };
	}
	return { heading: m.error_unexpected(), documentTitle: m.error_title_unexpected() };
}
