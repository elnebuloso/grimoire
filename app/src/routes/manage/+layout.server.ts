import { error } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';
import { database } from '#lib/server/db/index.js';
import { managementCounts } from '#lib/server/admin/status.js';

// The access hook decides; thrown here, the error renders in the layout.
export const load: LayoutServerLoad = ({ locals }) => {
	if (locals.accessDenied) error(locals.accessDenied);
	return { counts: managementCounts(database()) };
};
