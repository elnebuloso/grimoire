import { Cron } from 'croner';

/**
 * Checks a cron expression with the five standard fields (minute, hour, day of month, month,
 * day of week) and returns it. Throws a readable error for anything else, including a seconds
 * field, which would let a source be polled every second, and a schedule that never runs.
 */
export function parseSchedule(expression: string): string {
	let cron: Cron;
	try {
		cron = new Cron(expression, { mode: '5-part' });
	} catch (error) {
		throw new Error(`invalid cron expression "${expression}": ${(error as Error).message}`, {
			cause: error
		});
	}
	// Valid syntax can still name a date that does not exist, such as 30 February.
	if (cron.nextRun() === null) {
		throw new Error(`invalid cron expression "${expression}": it never runs`);
	}
	return expression;
}

/**
 * A source is due when it was never checked, or when its schedule had a run after the last check
 * that is not in the future. A run missed while the server was down is therefore made up once.
 * Times are read in `timezone`.
 */
export function isDue(
	schedule: string,
	lastCheckedAt: Date | null,
	now: Date,
	timezone: string
): boolean {
	if (!lastCheckedAt) {
		parseSchedule(schedule);
		return true;
	}
	const next = nextRun(schedule, lastCheckedAt, timezone);
	return next !== null && next <= now;
}

/** The first run of `schedule` after `after`, with times read in `timezone`. */
export function nextRun(schedule: string, after: Date, timezone: string): Date | null {
	return new Cron(parseSchedule(schedule), { mode: '5-part', timezone }).nextRun(after);
}
