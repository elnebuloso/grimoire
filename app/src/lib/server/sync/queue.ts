import type { SyncResult } from './sync';

export type RunSync = (sourceId: number, force: boolean) => Promise<SyncResult>;

interface Job {
	promise: Promise<SyncResult>;
	force: boolean;
}

/**
 * Runs syncs strictly one after another: a sync holds the database write lock while it replaces
 * an index, and the same source must never be synced twice at once.
 */
export function createSyncQueue(run: RunSync) {
	const pending = new Map<number, Job>();
	let tail: Promise<unknown> = Promise.resolve();

	/**
	 * Queues a sync of one source. While one is already waiting, its result is shared – unless
	 * this request forces a sync and the waiting one does not, so "sync now" is never swallowed.
	 */
	function request(sourceId: number, { force = false } = {}): Promise<SyncResult> {
		const waiting = pending.get(sourceId);
		if (waiting && (waiting.force || !force)) return waiting.promise;

		const promise = tail.then(() => run(sourceId, force));
		const job = { promise, force };
		pending.set(sourceId, job);
		tail = promise.catch(() => undefined);
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
			console.error(`listing sources to sync failed: ${(error as Error).message}`);
			return;
		}
		for (const sourceId of sourceIds) {
			queue.request(sourceId).catch((error: Error) => {
				console.error(`sync of source ${sourceId} failed: ${error.message}`);
			});
		}
	};
	poll();
	// Unreferenced, so a shutdown can finish: the server exits once its listener is closed and the
	// running sync is done, instead of waiting for a timer that never ends.
	const timer = setInterval(poll, intervalMs).unref();
	return () => clearInterval(timer);
}
