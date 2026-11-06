/** The one state a source is in, the most pressing first. */
export type SourceState = 'syncing' | 'error' | 'paused' | 'never' | 'synced';

/** How one sync run ended. */
export type RunOutcome = 'synced' | 'unchanged' | 'failed';

export function sourceState(
	source: { error: boolean; paused: boolean; lastSync: string | null },
	syncing = false
): SourceState {
	if (syncing) return 'syncing';
	if (source.error) return 'error';
	if (source.paused) return 'paused';
	if (source.lastSync === null) return 'never';
	return 'synced';
}
