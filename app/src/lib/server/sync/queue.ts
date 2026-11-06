// With its extension: a test runs this file in a child process with plain node.
import { createLimiter, type Limiter } from '../limiter.ts';
import { log } from '../log.ts';
import type { SyncResult } from './sync';

/**
 * Where the stages of a sync run: `check` asks the Git server whether the branch moved and only
 * waits on the network; `sync` clones, indexes and writes, which costs disk, CPU and the single
 * database write lock.
 */
export interface SyncLanes {
	check: Limiter;
	sync: Limiter;
}

export type RunSync = (sourceId: number, force: boolean, lanes: SyncLanes) => Promise<SyncResult>;

interface Job {
	promise: Promise<SyncResult>;
	force: boolean;
	started: () => boolean;
}

// Enough to check 200 sources well within a polling interval without flooding a Git server.
const PARALLEL_CHECKS = 4;

/**
 * Runs syncs with checks of several sources in parallel and the expensive stage one at a time.
 * The same source is never synced twice at once.
 */
export function createSyncQueue(run: RunSync, { parallelChecks = PARALLEL_CHECKS } = {}) {
	const lanes: SyncLanes = { check: createLimiter(parallelChecks), sync: createLimiter(1) };
	const pending = new Map<number, Job>();

	/**
	 * Queues a sync of one source. While one is waiting, its result is shared – unless this request
	 * forces a sync and the waiting one does not, so "sync now" is never swallowed. A running sync
	 * is shared only with unforced requests: a forced one queues the next run, since the running
	 * one may have checked the branch before the commit the admin wants. The new run starts after
	 * the one before it, so no source has more than one run waiting.
	 */
	function request(sourceId: number, { force = false } = {}): Promise<SyncResult> {
		const pendingJob = pending.get(sourceId);
		if (pendingJob && !force) return pendingJob.promise;
		if (pendingJob && pendingJob.force && !pendingJob.started()) return pendingJob.promise;

		const previous = pendingJob ? pendingJob.promise.catch(() => undefined) : Promise.resolve();
		let started = false;
		const promise = previous.then(() => {
			started = true;
			return run(sourceId, force, lanes);
		});
		const job: Job = { promise, force, started: () => started };
		pending.set(sourceId, job);
		promise
			.finally(() => {
				if (pending.get(sourceId) === job) pending.delete(sourceId);
			})
			.catch(() => undefined);
		return promise;
	}

	/** Queues a sync without waiting for it; a failure ends up in the log. */
	function requestInBackground(sourceId: number, options: { force?: boolean } = {}): void {
		request(sourceId, options).catch((error: Error) => {
			log.error({ err: error }, `sync of source ${sourceId} failed`);
		});
	}

	/** Whether a sync of the source is queued or running. */
	function isPending(sourceId: number): boolean {
		return pending.has(sourceId);
	}

	return { request, requestInBackground, isPending };
}

export type SyncQueue = ReturnType<typeof createSyncQueue>;

/** Queues every source now and then every `intervalMs`; returns a function that stops polling. */
export function startPolling(
	queue: Pick<SyncQueue, 'requestInBackground'>,
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
		for (const sourceId of sourceIds) queue.requestInBackground(sourceId);
	};
	poll();
	// Unreferenced, so a shutdown can finish: the server exits once its listener is closed and the
	// running sync is done, instead of waiting for a timer that never ends.
	const timer = setInterval(poll, intervalMs).unref();
	return () => clearInterval(timer);
}
