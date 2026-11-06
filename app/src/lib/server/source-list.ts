import type { ListSpec } from '#lib/list.js';
import { sourceState } from '#lib/source-state.js';
import type { SourceStats } from '#lib/server/stats.js';

/** How every list of sources searches, filters and sorts. */
export const SOURCE_LIST: ListSpec<SourceStats> = {
	search: (source) => `${source.name} ${source.slug}`,
	filters: {
		status: (source) => sourceState(source),
		visibility: (source) => source.visibility,
		warnings: (source) => (source.warnings > 0 ? 'yes' : 'no')
	},
	sorts: {
		name: (source) => source.name,
		status: (source) => sourceState(source),
		checked: (source) => source.lastCheck
	}
};
