import { describe, it, expect } from 'vitest';
import { isDue, nextRun, parseSchedule } from './schedule';

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

describe('nextRun', () => {
	it('keeps the local time across the change to winter time', () => {
		// Berlin leaves summer time (UTC+2) for winter time (UTC+1) on 25 October 2026.
		const before = nextRun('0 14 * * *', new Date('2026-10-23T13:00:00Z'), 'Europe/Berlin');
		const after = nextRun('0 14 * * *', new Date('2026-10-24T13:00:00Z'), 'Europe/Berlin');
		expect(before).toEqual(new Date('2026-10-24T12:00:00Z'));
		expect(after).toEqual(new Date('2026-10-25T13:00:00Z'));
	});

	it('keeps the local time across the change to summer time', () => {
		// Berlin enters summer time on 29 March 2026.
		const after = nextRun('0 14 * * *', new Date('2026-03-28T14:00:00Z'), 'Europe/Berlin');
		expect(after).toEqual(new Date('2026-03-29T12:00:00Z'));
	});
});

describe('parseSchedule', () => {
	it('accepts five fields', () => {
		expect(parseSchedule('0 2 * * 1-5')).toBe('0 2 * * 1-5');
	});

	it.each(['* * * * * *', 'every day', '61 * * * *', ''])('rejects "%s"', (expression) => {
		expect(() => parseSchedule(expression)).toThrow(/invalid cron expression/);
	});

	it.each(['0 0 30 2 *', '0 0 31 4 *'])('rejects "%s", a date that never comes', (expression) => {
		expect(() => parseSchedule(expression)).toThrow(/never runs/);
	});

	it('accepts 29 February, which comes in leap years', () => {
		expect(parseSchedule('0 0 29 2 *')).toBe('0 0 29 2 *');
	});
});
