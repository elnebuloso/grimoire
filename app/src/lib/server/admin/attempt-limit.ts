// ponytail: attempts are counted in memory and forgotten on restart; enough for one instance, a
// table if grimoire ever runs on several.

/** Allows each key `max` attempts within a sliding window of `windowMinutes`. */
export function createAttemptLimit(max: number, windowMinutes: number) {
	const attempts = new Map<string, number[]>();
	return {
		/** Records an attempt of `key`; false, recording nothing, once it made `max` in the window. */
		take(key: string, now: Date): boolean {
			const since = now.getTime() - windowMinutes * 60_000;
			// Without this, every key ever seen would stay in memory until a restart.
			for (const [other, times] of attempts) {
				if (times.every((time) => time <= since)) attempts.delete(other);
			}
			const times = (attempts.get(key) ?? []).filter((time) => time > since);
			if (times.length >= max) return false;
			attempts.set(key, [...times, now.getTime()]);
			return true;
		},
		/** Forgets the attempts of `key`, such as a client's failed logins once one succeeded. */
		forget(key: string) {
			attempts.delete(key);
		}
	};
}
