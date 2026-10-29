import { describe, it, expect } from 'vitest';
import { formatDateTime, parseTimeZone } from './time-zone';

describe('parseTimeZone', () => {
	it('is UTC when not set', () => {
		expect(parseTimeZone(undefined)).toBe('UTC');
		expect(parseTimeZone('')).toBe('UTC');
	});

	it('accepts an IANA name', () => {
		expect(parseTimeZone('Europe/Berlin')).toBe('Europe/Berlin');
	});

	it('rejects an unknown zone, naming the variable and the value', () => {
		expect(() => parseTimeZone('Mars/Olympus')).toThrow(/TZ "Mars\/Olympus"/);
	});
});

describe('formatDateTime', () => {
	const instant = '2026-10-29T18:06:56.148Z';

	it('shows the time in the given zone, with the zone', () => {
		expect(formatDateTime(instant, 'de', 'Europe/Berlin')).toBe('29. Okt. 2026, 19:06 MEZ');
		expect(formatDateTime(instant, 'en', 'UTC')).toBe('Oct 29, 2026, 6:06 PM UTC');
	});

	it('follows daylight saving time', () => {
		expect(formatDateTime('2026-07-01T12:00:00Z', 'de', 'Europe/Berlin')).toBe(
			'1. Juli 2026, 14:00 MESZ'
		);
	});
});
