/**
 * Checks the time zone of the instance (`TZ`), an IANA name such as `Europe/Berlin`, and returns
 * its canonical spelling; `UTC` when it is not set. Node itself treats an unknown `TZ` as UTC
 * without a word, so the check goes through `Intl`, which rejects it.
 */
export function parseTimeZone(value: string | undefined): string {
	if (!value) return 'UTC';
	try {
		return new Intl.DateTimeFormat('en', { timeZone: value }).resolvedOptions().timeZone;
	} catch {
		throw new Error(
			`TZ "${value}" is not a known time zone; use an IANA name such as Europe/Berlin`
		);
	}
}

/**
 * A stored timestamp as the UI shows it: in the time zone of the instance, not the browser's, so
 * the server and the hydrated page render the same text.
 *
 * The format per language comes from CLDR through `Intl` and is deliberately not configurable: a
 * format editor, let alone one per language, would cost more upkeep than it brings. Should a real
 * need come up, it becomes a language-independent switch in the settings, such as `hourCycle`,
 * passed on to `Intl.DateTimeFormat` here, never a format string.
 */
export function formatDateTime(iso: string, locale: string, timeZone: string): string {
	return new Intl.DateTimeFormat(locale, {
		timeZone,
		year: 'numeric',
		month: 'short',
		day: 'numeric',
		hour: 'numeric',
		minute: '2-digit',
		timeZoneName: 'short'
	}).format(new Date(iso));
}
