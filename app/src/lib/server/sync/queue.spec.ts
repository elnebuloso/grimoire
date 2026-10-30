import { describe, it, expect, vi, afterEach } from 'vitest';
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { captureLog } from '../capture-log';
import { createLimiter, createSyncQueue, startPolling, type SyncLanes } from './queue';
import type { SyncResult } from './sync';

/** Lets a test decide when each awaited piece of work finishes. */
function gate() {
	const releases: (() => void)[] = [];
	const wait = () => new Promise<void>((resolve) => releases.push(resolve));
	const releaseAll = async () => {
		while (releases.length > 0) {
			releases.splice(0).forEach((release) => release());
			await flush();
		}
	};
	return { wait, releaseAll, waiting: () => releases.length };
}

/** Lets pending promise callbacks run. */
async function flush() {
	for (let i = 0; i < 10; i++) await Promise.resolve();
}

/**
 * A fake sync with both stages, each waiting on a gate, recording what ran and the highest number
 * of stages of each kind running at once.
 */
function fakeSync() {
	const checks = gate();
	const syncs = gate();
	const started: [number, boolean][] = [];
	const running = { check: 0, sync: 0 };
	const highest = { check: 0, sync: 0 };
	const stage = async (kind: 'check' | 'sync', wait: () => Promise<void>) => {
		running[kind]++;
		highest[kind] = Math.max(highest[kind], running[kind]);
		await wait();
		running[kind]--;
	};
	const run = vi.fn(async (sourceId: number, force: boolean, lanes: SyncLanes) => {
		started.push([sourceId, force]);
		await lanes.check(() => stage('check', checks.wait));
		await lanes.sync(() => stage('sync', syncs.wait));
		return { status: 'synced', commit: `c${sourceId}`, pages: 0, warnings: [] } as SyncResult;
	});
	const finishAll = async () => {
		await flush();
		while (checks.waiting() + syncs.waiting() > 0) {
			await checks.releaseAll();
			await syncs.releaseAll();
			await flush();
		}
	};
	return { run, started, highest, checks, syncs, finishAll };
}

afterEach(() => {
	vi.useRealTimers();
	vi.restoreAllMocks();
});

describe('createLimiter', () => {
	it('runs at most the given number at once and all of them in the end', async () => {
		const limit = createLimiter(2);
		const work = gate();
		let running = 0;
		let highest = 0;
		const done = Array.from({ length: 5 }, () =>
			limit(async () => {
				running++;
				highest = Math.max(highest, running);
				await work.wait();
				running--;
			})
		);
		await flush();
		expect(work.waiting()).toBe(2);

		await work.releaseAll();
		await Promise.all(done);
		expect(highest).toBe(2);
	});
});

describe('createSyncQueue', () => {
	it('checks up to four sources at once but syncs one at a time', async () => {
		const fake = fakeSync();
		const queue = createSyncQueue(fake.run);
		const results = Array.from({ length: 10 }, (_, i) => queue.request(i + 1));
		await flush();
		expect(fake.checks.waiting()).toBe(4);

		await fake.finishAll();
		await Promise.all(results);
		expect(fake.started).toHaveLength(10);
		expect(fake.highest).toEqual({ check: 4, sync: 1 });
	});

	it('shares the pending sync of a source instead of queueing it twice', async () => {
		const fake = fakeSync();
		const queue = createSyncQueue(fake.run);
		const first = queue.request(1);

		expect(queue.request(1)).toBe(first);
		await fake.finishAll();
		await first;
		expect(fake.run).toHaveBeenCalledTimes(1);
	});

	it('runs a forced sync after a pending unforced one of the same source, never alongside', async () => {
		const fake = fakeSync();
		const queue = createSyncQueue(fake.run);
		const polled = queue.request(1);
		const forced = queue.request(1, { force: true });

		expect(forced).not.toBe(polled);
		expect(queue.request(1, { force: true })).toBe(forced);
		await flush();
		expect(fake.started).toEqual([[1, false]]);

		await fake.finishAll();
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
		const request = vi.fn();
		const stop = startPolling({ requestInBackground: request }, () => [1, 2], 60_000);
		expect(request.mock.calls).toEqual([[1], [2]]);

		vi.advanceTimersByTime(60_000);
		expect(request).toHaveBeenCalledTimes(4);

		stop();
		vi.advanceTimersByTime(60_000);
		expect(request).toHaveBeenCalledTimes(4);
	});

	it('logs a failed sync and a failed listing without stopping', async () => {
		vi.useFakeTimers();
		const output = captureLog();
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

		const stop = startPolling(createSyncQueue(request), listSources, 1000);
		await vi.advanceTimersByTimeAsync(2000);
		stop();

		expect(request.mock.calls.map(([id]) => id)).toEqual([1, 2, 1, 2]);
		expect(
			output.lines().map((line) => [line.message, (line.error as { message: string }).message])
		).toEqual([
			['sync of source 1 failed', 'boom'],
			['listing sources to sync failed', 'database is locked'],
			['sync of source 1 failed', 'boom']
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
			startPolling({ requestInBackground: () => {} }, () => [1], 60000);
		`;
		const result = spawnSync(process.execPath, ['--input-type=module', '-e', script], {
			timeout: 10_000
		});
		expect(result.signal).toBeNull();
		expect(result.status).toBe(0);
	}, 15_000);
});
