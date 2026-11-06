import { describe, it, expect } from 'vitest';
import { upcomingRuns } from './schedule';

const NOW = new Date('2026-11-06T12:00:00.000Z');

describe('upcomingRuns', () => {
	it('lists the next runs in the time zone, skipping the weekend', () => {
		expect(
			upcomingRuns('0 6 * * 1-5', 'Europe/Berlin', NOW)?.map((run) => run.toISOString())
		).toEqual(['2026-11-09T05:00:00.000Z', '2026-11-10T05:00:00.000Z', '2026-11-11T05:00:00.000Z']);
	});

	it('has none for an invalid expression, a seconds field or a date that never comes', () => {
		expect(upcomingRuns('every morning', 'UTC', NOW)).toBeUndefined();
		expect(upcomingRuns('0 0 6 * * *', 'UTC', NOW)).toBeUndefined();
		expect(upcomingRuns('0 6 30 2 *', 'UTC', NOW)).toBeUndefined();
	});
});
