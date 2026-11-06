import type { PageServerLoad } from './$types';
import { database } from '#lib/server/db/index.js';
import { deadLinks, type DeadLinkInSource } from '#lib/server/admin/status.js';

// The page lists every source with dead links; one with hundreds would bury the others, and the
// Status tab of the source lists them all.
const SHOWN_PER_SOURCE = 20;

export const load: PageServerLoad = () => {
	const groups: {
		sourceId: number;
		source: string;
		name: string;
		path: string;
		links: DeadLinkInSource[];
		/** Dead links of the source, also those not listed. */
		total: number;
	}[] = [];
	for (const link of deadLinks(database())) {
		const group = groups.at(-1);
		if (group?.sourceId === link.sourceId) {
			group.total += 1;
			if (group.links.length < SHOWN_PER_SOURCE) group.links.push(link);
		} else {
			groups.push({
				sourceId: link.sourceId,
				source: link.source,
				name: link.name,
				path: link.path,
				links: [link],
				total: 1
			});
		}
	}
	return { groups };
};
