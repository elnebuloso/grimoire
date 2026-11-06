import { isIPv6 } from 'node:net';

// ponytail: attempts are counted in memory and forgotten on restart; enough for one instance, a
// table if grimoire ever runs on several.

/** Allows each key `max` attempts within a sliding window of `windowMinutes`. */
export function createAttemptLimit(max: number, windowMinutes: number) {
	// Ordered by each key's latest attempt: a key is moved to the end whenever one is recorded.
	const attempts = new Map<string, number[]>();
	return {
		/** Records an attempt of `key`; false, recording nothing, once it made `max` in the window. */
		take(key: string, now: Date): boolean {
			const since = now.getTime() - windowMinutes * 60_000;
			// Without this, every key ever seen would stay in memory until a restart. Thanks to the
			// order, only the keys that expired are visited, however many clients are tracked.
			for (const [other, times] of attempts) {
				if (times.at(-1)! > since) break;
				attempts.delete(other);
			}
			const times = (attempts.get(key) ?? []).filter((time) => time > since);
			if (times.length >= max) return false;
			attempts.delete(key);
			attempts.set(key, [...times, now.getTime()]);
			return true;
		},
		/** Forgets the attempts of `key`, such as a client's failed logins once one succeeded. */
		forget(key: string) {
			attempts.delete(key);
		}
	};
}

/**
 * The key a client address is limited by: an IPv6 address by its `/64`, which one client usually
 * holds whole and could rotate through, every other address as it is.
 */
export function clientKey(address: string): string {
	const plain = address.split('%')[0];
	if (!isIPv6(plain)) return address;
	const mapped = /^::ffff:(\d+\.\d+\.\d+\.\d+)$/i.exec(plain);
	if (mapped) return mapped[1];
	const [head, tail] = plain.split('::');
	const groups = (part: string | undefined) => (part ? part.split(':') : []);
	// An embedded IPv4 address at the end takes the room of two groups.
	const size = (parts: string[]) => parts.length + (parts.at(-1)?.includes('.') ? 1 : 0);
	const zeros = tail === undefined ? 0 : 8 - size(groups(head)) - size(groups(tail));
	const all = [...groups(head), ...Array<string>(zeros).fill('0'), ...groups(tail)];
	return `${all
		.slice(0, 4)
		.map((group) => parseInt(group, 16).toString(16))
		.join(':')}::/64`;
}
