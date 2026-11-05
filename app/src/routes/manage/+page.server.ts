import type { PageServerLoad } from './$types';
import { database } from '#lib/server/db/index.js';
import { dashboard } from '#lib/server/admin/status.js';
import { readSettings } from '#lib/server/settings.js';

export const load: PageServerLoad = () => ({
	...dashboard(database()),
	syncsPaused: readSettings(database()).syncsPaused
});
