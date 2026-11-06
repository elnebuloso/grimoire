import type { PageServerLoad } from './$types';
import { database } from '#lib/server/db/index.js';
import { sourceOverlaps } from '#lib/server/admin/status.js';

// Admins only: the list names every source, internal ones included.
export const load: PageServerLoad = ({ locals }) => ({
	pairs: sourceOverlaps(database(), locals).map(({ kind, first, second }) => ({
		kind,
		first: { id: first.id, slug: first.slug, name: first.name },
		second: { id: second.id, slug: second.slug, name: second.name }
	}))
});
