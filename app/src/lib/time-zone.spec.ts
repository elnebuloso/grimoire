import { describe, it, expect } from 'vitest';
import {
	dateIn,
	formatDate,
	formatDateTime,
	formatShortDateTime,
	parseTimeZone
} from './time-zone';

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

	it('shows a short date and time without the zone', () => {
		expect(formatShortDateTime('2026-10-29T18:06:56.148Z', 'en', 'UTC')).toBe('10/29/26, 6:06 PM');
		expect(formatShortDateTime('2026-10-29T18:06:56.148Z', 'de', 'Europe/Berlin')).toBe(
			'29.10.26, 19:06'
		);
	});

	it('follows daylight saving time', () => {
		expect(formatDateTime('2026-07-01T12:00:00Z', 'de', 'Europe/Berlin')).toBe(
			'1. Juli 2026, 14:00 MESZ'
		);
	});
});

describe('dateIn', () => {
	it('gives the date of an instant in the time zone, not in UTC', () => {
		const instant = new Date('2026-10-30T23:30:00Z');
		expect(dateIn('UTC', instant)).toBe('2026-10-30');
		expect(dateIn('Europe/Berlin', instant)).toBe('2026-10-31');
		expect(dateIn('America/New_York', new Date('2026-01-01T03:00:00Z'))).toBe('2025-12-31');
	});
});

describe('formatDate', () => {
	it('shows a date the same in every time zone', () => {
		expect(formatDate('2026-11-30', 'en')).toBe('Nov 30, 2026');
		expect(formatDate('2026-11-30', 'de')).toBe('30.11.2026');
	});
});
