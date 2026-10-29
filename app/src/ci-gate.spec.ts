import { expect, test } from 'vitest';

test('fails on purpose to prove a red check blocks the release', () => {
	expect(true).toBe(false);
});
