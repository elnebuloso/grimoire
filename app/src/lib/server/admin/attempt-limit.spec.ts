import { describe, it, expect } from 'vitest';
import { clientKey, createAttemptLimit } from './attempt-limit';

const minutes = (count: number) => new Date(Date.UTC(2026, 0, 1) + count * 60_000);

describe('createAttemptLimit', () => {
	it('refuses a key after max attempts and allows it again once the window has passed', () => {
		const limit = createAttemptLimit(2, 15);

		expect(limit.take('203.0.113.7', minutes(0))).toBe(true);
		expect(limit.take('203.0.113.7', minutes(1))).toBe(true);
		expect(limit.take('203.0.113.7', minutes(2))).toBe(false);
		expect(limit.take('198.51.100.4', minutes(2))).toBe(true);
		expect(limit.take('203.0.113.7', minutes(15.5))).toBe(true);
		expect(limit.take('203.0.113.7', minutes(15.6))).toBe(false);
	});

	it('keeps the attempts of a key that is still in its window while older keys expire', () => {
		const limit = createAttemptLimit(2, 15);
		limit.take('203.0.113.7', minutes(0));
		limit.take('198.51.100.4', minutes(5));
		limit.take('203.0.113.7', minutes(10));

		// At 17 the attempt at 0 has expired, the one at 10 has not.
		expect(limit.take('203.0.113.7', minutes(17))).toBe(true);
		expect(limit.take('203.0.113.7', minutes(18))).toBe(false);
	});
});

describe('clientKey', () => {
	it.each([
		['192.0.2.1', '192.0.2.1'],
		['::ffff:192.0.2.1', '192.0.2.1'],
		['2001:db8:1:2:aaaa::1', '2001:db8:1:2::/64'],
		['2001:DB8:1:2:bbbb:cccc:dddd:eeee', '2001:db8:1:2::/64'],
		['2001:0db8:0001::1', '2001:db8:1:0::/64'],
		['::1', '0:0:0:0::/64'],
		['64:ff9b::192.0.2.1', '64:ff9b:0:0::/64'],
		['fe80::1%eth0', 'fe80:0:0:0::/64']
	])('limits %s as %s', (address, key) => {
		expect(clientKey(address)).toBe(key);
	});

	it('tells addresses of different /64 networks apart', () => {
		expect(clientKey('2001:db8:1:2::1')).not.toBe(clientKey('2001:db8:1:3::1'));
	});
});
