import type { PageServerLoad } from './$types';
import { database } from '#lib/server/db/index.js';
import { mayManageSource } from '#lib/server/admin/access.js';
import { findSource } from '#lib/server/admin/sources.js';
import { deadLinks, type DeadLinkInSource } from '#lib/server/admin/status.js';

// Only where the user can fix them: in the sources they manage.
export const load: PageServerLoad = ({ locals }) => {
	const db = database();
	const managed = new Map<number, boolean>();
	const mayFix = (sourceId: number) => {
		if (!managed.has(sourceId)) {
			const source = findSource(db, sourceId);
			managed.set(sourceId, source !== undefined && mayManageSource(locals.user!, source));
		}
		return managed.get(sourceId)!;
	};
	const groups: { sourceId: number; source: string; links: DeadLinkInSource[] }[] = [];
	for (const link of deadLinks(db)) {
		if (!mayFix(link.sourceId)) continue;
		const group = groups.at(-1);
		if (group?.sourceId === link.sourceId) group.links.push(link);
		else groups.push({ sourceId: link.sourceId, source: link.source, links: [link] });
	}
	return { groups };
};
