import type { PageServerLoad } from './$types';
import { database } from '#lib/server/db/index.js';
import { findOverlaps } from '#lib/server/admin/duplicates.js';
import { listSources } from '#lib/server/admin/sources.js';

// Admins only: the list names private sources of every user.
export const load: PageServerLoad = () => ({
	pairs: findOverlaps(listSources(database())).map(({ kind, first, second }) => ({
		kind,
		first: { id: first.id, slug: first.slug },
		second: { id: second.id, slug: second.slug }
	}))
});
