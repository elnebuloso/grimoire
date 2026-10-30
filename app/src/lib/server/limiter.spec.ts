import { describe, it, expect } from 'vitest';
import { createLimiter } from './limiter';

/** Lets pending promise callbacks run. */
async function flush() {
	for (let i = 0; i < 10; i++) await Promise.resolve();
}

describe('createLimiter', () => {
	it('runs at most the given number at once, in the order they came', async () => {
		const limit = createLimiter(2);
		const releases: (() => void)[] = [];
		const started: number[] = [];
		const done = [0, 1, 2, 3, 4].map((n) =>
			limit(async () => {
				started.push(n);
				await new Promise<void>((resolve) => releases.push(resolve));
			})
		);
		await flush();
		expect(started).toEqual([0, 1]);

		releases.shift()!();
		await flush();
		expect(started).toEqual([0, 1, 2]);

		while (releases.length > 0) {
			releases.splice(0).forEach((release) => release());
			await flush();
		}
		await Promise.all(done);
		expect(started).toEqual([0, 1, 2, 3, 4]);
	});
});
