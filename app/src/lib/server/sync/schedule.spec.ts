import { describe, it, expect } from 'vitest';
import { isDue, parseSchedule } from './schedule';

const at = (time: string) => new Date(`2026-10-28T${time}Z`);

// Pinned to UTC so the result does not depend on the machine's time zone.
const due = (schedule: string, lastChecked: string | null, now: string) =>
	isDue(schedule, lastChecked ? at(lastChecked) : null, at(now), 'UTC');

describe('isDue', () => {
	it('is due when never checked', () => {
		expect(due('*/5 * * * *', null, '12:00:00')).toBe(true);
	});

	it('rejects an invalid schedule even before the first check', () => {
		expect(() => due('nope', null, '12:00:00')).toThrow(/invalid cron expression "nope"/);
	});

	it('is due once the next run after the last check has come', () => {
		expect(due('*/5 * * * *', '12:00:10', '12:04:59')).toBe(false);
		expect(due('*/5 * * * *', '12:00:10', '12:05:00')).toBe(true);
	});

	it('makes up a run missed while the server was down', () => {
		expect(due('0 2 * * *', '02:00:30', '13:00:00')).toBe(false);
		expect(due('0 */6 * * *', '02:00:30', '13:00:00')).toBe(true);
	});

	it('reads times in the given time zone', () => {
		// 14:00 in Berlin is 13:00 UTC on this date (winter time).
		expect(isDue('0 14 * * *', at('11:00:00'), at('13:30:00'), 'Europe/Berlin')).toBe(true);
		expect(isDue('0 14 * * *', at('11:00:00'), at('13:30:00'), 'UTC')).toBe(false);
	});
});

describe('parseSchedule', () => {
	it('accepts five fields', () => {
		expect(parseSchedule('0 2 * * 1-5')).toBe('0 2 * * 1-5');
	});

	it.each(['* * * * * *', 'every day', '61 * * * *', ''])('rejects "%s"', (expression) => {
		expect(() => parseSchedule(expression)).toThrow(/invalid cron expression/);
	});
});
