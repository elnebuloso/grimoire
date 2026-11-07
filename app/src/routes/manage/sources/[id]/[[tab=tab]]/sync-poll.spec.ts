import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

vi.mock('$app/paths', () => ({ resolve: () => '/manage/sources/1/sync-pending' }));

const { pollSyncEnd } = await import('./sync-poll');

/** Answers each request after `delayMs` with whether the sync is still pending. */
function answering(pending: () => boolean, delayMs: number) {
	return vi.fn(
		() =>
			new Promise<Response>((resolve) =>
				setTimeout(() => resolve(Response.json({ pending: pending() })), delayMs)
			)
	);
}

beforeEach(() => {
	vi.useFakeTimers();
});

afterEach(() => {
	vi.useRealTimers();
	vi.unstubAllGlobals();
});

describe('pollSyncEnd', () => {
	it('reports the end once, also when answers take longer than the interval', async () => {
		let pending = true;
		vi.stubGlobal(
			'fetch',
			answering(() => pending, 5000)
		);
		const ended = vi.fn();

		pollSyncEnd(1, ended);
		await vi.advanceTimersByTimeAsync(4000);
		pending = false;
		await vi.advanceTimersByTimeAsync(30_000);

		expect(ended).toHaveBeenCalledTimes(1);
	});

	it('reports nothing once stopped, also for a request already out', async () => {
		vi.stubGlobal(
			'fetch',
			answering(() => false, 3000)
		);
		const ended = vi.fn();

		const stop = pollSyncEnd(1, ended);
		await vi.advanceTimersByTimeAsync(2500);
		stop();
		await vi.advanceTimersByTimeAsync(30_000);

		expect(ended).not.toHaveBeenCalled();
	});
});
