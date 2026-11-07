import { resolve } from '$app/paths';

// Often enough to report the end of a sync soon, rarely enough to cost nothing.
const POLL_MS = 2000;

/**
 * Asks every two seconds whether the queued sync of a source is still pending, and calls `ended`
 * once it is not. Returns the function that stops asking. The question does not keep an idle
 * session alive; a page reload would.
 */
export function pollSyncEnd(sourceId: number, ended: () => void): () => void {
	const url = resolve('/manage/sources/[id]/sync-pending', { id: String(sourceId) });
	let stopped = false;
	let timer: ReturnType<typeof setTimeout>;
	// The next question only after the answer: a slow answer would otherwise overlap the next
	// question, and both could report the end.
	const ask = async () => {
		const response = await fetch(url);
		// An ended session answers with the login page, not JSON: the refresh then leads there.
		const { pending } = await response.json().catch(() => ({ pending: false }));
		if (stopped) return;
		if (pending) timer = setTimeout(ask, POLL_MS);
		else ended();
	};
	timer = setTimeout(ask, POLL_MS);
	return () => {
		stopped = true;
		clearTimeout(timer);
	};
}
