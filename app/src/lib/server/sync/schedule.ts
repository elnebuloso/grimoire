import { Cron } from 'croner';

/**
 * Checks a cron expression with the five standard fields (minute, hour, day of month, month,
 * day of week) and returns it. Throws a readable error for anything else, including a seconds
 * field, which would let a source be polled every second.
 */
export function parseSchedule(expression: string): string {
	try {
		new Cron(expression, { mode: '5-part' });
	} catch (error) {
		throw new Error(`invalid cron expression "${expression}": ${(error as Error).message}`, {
			cause: error
		});
	}
	return expression;
}

/**
 * A source is due when it was never checked, or when its schedule had a run after the last check
 * that is not in the future. A run missed while the server was down is therefore made up once.
 * Times are read in `timezone`, by default the server's.
 */
export function isDue(
	schedule: string,
	lastCheckedAt: Date | null,
	now: Date,
	timezone?: string
): boolean {
	const cron = new Cron(parseSchedule(schedule), { mode: '5-part', timezone });
	if (!lastCheckedAt) return true;
	const next = cron.nextRun(lastCheckedAt);
	return next !== null && next <= now;
}
