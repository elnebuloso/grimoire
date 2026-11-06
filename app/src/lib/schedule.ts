import { Cron } from 'croner';

/**
 * The next `count` runs of a cron schedule after `after`, read in `timeZone`, as the sync
 * scheduler plans them; undefined while the expression is not a valid five-field schedule or
 * never runs.
 */
export function upcomingRuns(
	expression: string,
	timeZone: string,
	after: Date,
	count = 3
): Date[] | undefined {
	try {
		const runs = new Cron(expression.trim(), { mode: '5-part', timezone: timeZone }).nextRuns(
			count,
			after
		);
		return runs.length > 0 ? runs : undefined;
	} catch {
		return undefined;
	}
}
