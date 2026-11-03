import type { PageServerLoad } from './$types';
import { database } from '#lib/server/db/index.js';
import { hasRoles } from '#lib/server/admin/access.js';
import { listMissedQueries } from '#lib/server/missed-queries.js';

// A user sees the questions that named one of their own sources; questions across all sources
// and about other sources are the admins'.
export const load: PageServerLoad = ({ locals }) => {
	const db = database();
	const queries = listMissedQueries(db);
	if (hasRoles(locals.user!, ['admin'])) return { queries };
	const own = (
		db.prepare('SELECT slug FROM sources WHERE owner_id = ?').all(locals.user!.id) as {
			slug: string;
		}[]
	).map((row) => row.slug);
	return {
		queries: queries.filter((query) => query.sources?.some((slug) => own.includes(slug)))
	};
};
