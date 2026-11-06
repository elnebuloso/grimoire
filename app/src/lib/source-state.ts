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

/**
 * The values of the source list's filters on state and warnings, as they stand in its URL. The
 * list's page and the links to a filtered list are built from these; the server reads the same.
 */
export const SOURCE_FILTERS = {
	status: ['error', 'paused', 'never', 'synced'],
	warnings: ['yes', 'no']
} as const satisfies {
	status: readonly Exclude<SourceState, 'syncing'>[];
	warnings: readonly string[];
};

export type SourceFilter = keyof typeof SOURCE_FILTERS;

/** The query of the source list that shows only the sources with `value` for `filter`. */
export function sourceFilterQuery<F extends SourceFilter>(
	filter: F,
	value: (typeof SOURCE_FILTERS)[F][number]
): string {
	return `?${new URLSearchParams({ [filter]: value })}`;
}
