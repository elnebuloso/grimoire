import { describe, it, expect, vi, afterEach } from 'vitest';
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { createSyncQueue, startPolling } from './queue';
import type { SyncResult } from './sync';

/** A fake sync that finishes only when released, and records what ran and how many at once. */
function controlledRun() {
	const started: [number, boolean][] = [];
	const releases: (() => void)[] = [];
	let running = 0;
	let maxRunning = 0;
	const run = vi.fn((sourceId: number, force: boolean) => {
		started.push([sourceId, force]);
		running++;
		maxRunning = Math.max(maxRunning, running);
		return new Promise<SyncResult>((resolve) => {
			releases.push(() => {
				running--;
				resolve({ status: 'unchanged', commit: `c${sourceId}` });
			});
		});
	});
	const releaseNext = async () => {
		await vi.waitFor(() => expect(releases.length).toBeGreaterThan(0));
		releases.shift()!();
	};
	return { run, started, releaseNext, maxRunning: () => maxRunning };
}

afterEach(() => {
	vi.useRealTimers();
	vi.restoreAllMocks();
});

describe('createSyncQueue', () => {
	it('runs syncs one after another', async () => {
		const fake = controlledRun();
		const queue = createSyncQueue(fake.run);
		const results = [queue.request(1), queue.request(2), queue.request(3)];

		for (let i = 0; i < 3; i++) await fake.releaseNext();
		await Promise.all(results);
		expect(fake.started).toEqual([
			[1, false],
			[2, false],
			[3, false]
		]);
		expect(fake.maxRunning()).toBe(1);
	});

	it('shares the pending sync of a source instead of queueing it twice', async () => {
		const fake = controlledRun();
		const queue = createSyncQueue(fake.run);
		const first = queue.request(1);
		const second = queue.request(1);

		expect(second).toBe(first);
		await fake.releaseNext();
		await first;
		expect(fake.run).toHaveBeenCalledTimes(1);
	});

	it('queues a forced sync behind a pending unforced one', async () => {
		const fake = controlledRun();
		const queue = createSyncQueue(fake.run);
		const polled = queue.request(1);
		const forced = queue.request(1, { force: true });

		expect(forced).not.toBe(polled);
		expect(queue.request(1, { force: true })).toBe(forced);
		await fake.releaseNext();
		await fake.releaseNext();
		await Promise.all([polled, forced]);
		expect(fake.started).toEqual([
			[1, false],
			[1, true]
		]);
	});

	it('keeps going after a sync throws', async () => {
		const run = vi.fn(async (sourceId: number): Promise<SyncResult> => {
			if (sourceId === 1) throw new Error('source 1 does not exist');
			return { status: 'unchanged', commit: 'c' };
		});
		const queue = createSyncQueue(run);

		await expect(queue.request(1)).rejects.toThrow('source 1 does not exist');
		await expect(queue.request(2)).resolves.toMatchObject({ status: 'unchanged' });
		await expect(queue.request(1)).rejects.toThrow();
		expect(run).toHaveBeenCalledTimes(3);
	});
});

describe('startPolling', () => {
	it('queues every source at start and after each interval, until stopped', async () => {
		vi.useFakeTimers();
		const request = vi.fn(() => Promise.resolve<SyncResult>({ status: 'unchanged', commit: 'c' }));
		const stop = startPolling({ request }, () => [1, 2], 60_000);
		expect(request.mock.calls).toEqual([[1], [2]]);

		vi.advanceTimersByTime(60_000);
		expect(request).toHaveBeenCalledTimes(4);

		stop();
		vi.advanceTimersByTime(60_000);
		expect(request).toHaveBeenCalledTimes(4);
	});

	it('logs a failed sync and a failed listing without stopping', async () => {
		vi.useFakeTimers();
		const log = vi.spyOn(console, 'error').mockImplementation(() => {});
		const request = vi.fn((sourceId: number) =>
			sourceId === 1
				? Promise.reject(new Error('boom'))
				: Promise.resolve<SyncResult>({ status: 'unchanged', commit: 'c' })
		);
		let listing = 0;
		const listSources = () => {
			if (++listing === 2) throw new Error('database is locked');
			return [1, 2];
		};

		const stop = startPolling({ request }, listSources, 1000);
		await vi.advanceTimersByTimeAsync(2000);
		stop();

		expect(request.mock.calls.map(([id]) => id)).toEqual([1, 2, 1, 2]);
		expect(log.mock.calls.map(([message]) => message)).toEqual([
			'sync of source 1 failed: boom',
			'listing sources to sync failed: database is locked',
			'sync of source 1 failed: boom'
		]);
	});
});

describe('startPolling in a process', () => {
	// The server shuts down on SIGTERM by closing its listener and letting the event loop drain;
	// a timer that keeps the loop alive would leave it hanging until it is killed.
	it('does not keep the process alive', () => {
		const queueUrl = pathToFileURL(join(import.meta.dirname, 'queue.ts')).href;
		const script = `
			import { startPolling } from ${JSON.stringify(queueUrl)};
			startPolling({ request: async () => ({ status: 'unchanged', commit: 'c' }) }, () => [1], 60000);
		`;
		const result = spawnSync(process.execPath, ['--input-type=module', '-e', script], {
			timeout: 10_000
		});
		expect(result.signal).toBeNull();
		expect(result.status).toBe(0);
	}, 15_000);
});
