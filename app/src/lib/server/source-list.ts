import type { ListSpec } from '#lib/list.js';
import { sourceState, type SourceFilter } from '#lib/source-state.js';
import type { SourceStats } from '#lib/server/stats.js';

// Every filter of `SOURCE_FILTERS` must be one of the list; a renamed one fails here.
const filters: Record<SourceFilter | 'visibility', (source: SourceStats) => string> = {
	status: (source) => sourceState(source),
	visibility: (source) => source.visibility,
	warnings: (source) => (source.warnings > 0 ? 'yes' : 'no')
};

/** How every list of sources searches, filters and sorts. */
export const SOURCE_LIST: ListSpec<SourceStats> = {
	search: (source) => `${source.name} ${source.slug}`,
	filters,
	sorts: {
		name: (source) => source.name,
		status: (source) => sourceState(source),
		checked: (source) => source.lastCheck
	}
};
