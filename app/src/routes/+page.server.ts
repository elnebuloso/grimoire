import type { PageServerLoad } from './$types';
import { database } from '#lib/server/db/index.js';
import { sourceStats } from '#lib/server/stats.js';
import { publicOrigin } from '#lib/server/public-origin.js';

export const load: PageServerLoad = ({ url }) => ({
	sources: sourceStats(database()),
	origin: publicOrigin(url)
});
