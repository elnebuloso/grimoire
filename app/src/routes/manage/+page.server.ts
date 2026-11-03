import type { PageServerLoad } from './$types';
import { database } from '#lib/server/db/index.js';
import { dashboard } from '#lib/server/admin/status.js';
import { readSettings } from '#lib/server/settings.js';

export const load: PageServerLoad = ({ locals }) => ({
	// The access hook lets only logged-in users into the management area.
	...dashboard(database(), locals.user!),
	syncsPaused: readSettings(database()).syncsPaused
});
