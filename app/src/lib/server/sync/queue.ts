// With its extension: a test runs this file in a child process with plain node.
import { log } from '../log.ts';
import type { SyncResult } from './sync';

/** Runs `work` once a slot is free. */
export type Lane = <T>(work: () => Promise<T>) => Promise<T>;

/**
 * Where the stages of a sync run: `check` asks the Git server whether the branch moved and only
 * waits on the network; `sync` clones, indexes and writes, which costs disk, CPU and the single
 * database write lock.
 */
export interface SyncLanes {
	check: Lane;
	sync: Lane;
}

export type RunSync = (sourceId: number, force: boolean, lanes: SyncLanes) => Promise<SyncResult>;

interface Job {
	promise: Promise<SyncResult>;
	force: boolean;
}

// Enough to check 200 sources well within a polling interval without flooding a Git server.
const PARALLEL_CHECKS = 4;

/** Lets at most `max` pieces of work run at once; the others wait in order. */
export function createLimiter(max: number): Lane {
	let active = 0;
	const waiting: (() => void)[] = [];
	return async (work) => {
		// A finished piece hands its slot straight to the next waiting one, so a newcomer
		// cannot slip in between and exceed the limit.
		if (active < max) active++;
		else await new Promise<void>((resolve) => waiting.push(resolve));
		try {
			return await work();
		} finally {
			const next = waiting.shift();
			if (next) next();
			else active--;
		}
	};
}

/**
 * Runs syncs with checks of several sources in parallel and the expensive stage one at a time.
 * The same source is never synced twice at once.
 */
export function createSyncQueue(run: RunSync, { parallelChecks = PARALLEL_CHECKS } = {}) {
	const lanes: SyncLanes = { check: createLimiter(parallelChecks), sync: createLimiter(1) };
	const pending = new Map<number, Job>();

	/**
	 * Queues a sync of one source. While one is pending, its result is shared – unless this
	 * request forces a sync and the pending one does not, so "sync now" is never swallowed;
	 * the forced sync then starts after it.
	 */
	function request(sourceId: number, { force = false } = {}): Promise<SyncResult> {
		const waiting = pending.get(sourceId);
		if (waiting && (waiting.force || !force)) return waiting.promise;

		const previous = waiting ? waiting.promise.catch(() => undefined) : Promise.resolve();
		const promise = previous.then(() => run(sourceId, force, lanes));
		const job = { promise, force };
		pending.set(sourceId, job);
		promise
			.finally(() => {
				if (pending.get(sourceId) === job) pending.delete(sourceId);
			})
			.catch(() => undefined);
		return promise;
	}

	return { request };
}

export type SyncQueue = ReturnType<typeof createSyncQueue>;

/** Queues every source now and then every `intervalMs`; returns a function that stops polling. */
export function startPolling(
	queue: SyncQueue,
	listSources: () => number[],
	intervalMs: number
): () => void {
	const poll = () => {
		let sourceIds: number[];
		try {
			sourceIds = listSources();
		} catch (error) {
			// Thrown from a timer it would end the process; the next round tries again.
			log.error({ err: error }, 'listing sources to sync failed');
			return;
		}
		for (const sourceId of sourceIds) {
			queue.request(sourceId).catch((error: Error) => {
				log.error({ err: error }, `sync of source ${sourceId} failed`);
			});
		}
	};
	poll();
	// Unreferenced, so a shutdown can finish: the server exits once its listener is closed and the
	// running sync is done, instead of waiting for a timer that never ends.
	const timer = setInterval(poll, intervalMs).unref();
	return () => clearInterval(timer);
}
