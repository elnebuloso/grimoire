import type { PageServerLoad } from './$types';
import { database } from '#lib/server/db/index.js';
import { deadLinks, type DeadLinkInSource } from '#lib/server/admin/status.js';

export const load: PageServerLoad = () => {
	const groups: {
		projectId: number;
		project: string;
		sourceId: number;
		source: string;
		links: DeadLinkInSource[];
	}[] = [];
	for (const link of deadLinks(database())) {
		const group = groups.at(-1);
		if (group?.sourceId === link.sourceId) group.links.push(link);
		else {
			const { projectId, project, sourceId, source } = link;
			groups.push({ projectId, project, sourceId, source, links: [link] });
		}
	}
	return { groups };
};
