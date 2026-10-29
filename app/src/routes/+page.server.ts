import type { PageServerLoad } from './$types';
import { database } from '#lib/server/db/index.js';
import { projectStats } from '#lib/server/stats.js';

export const load: PageServerLoad = () => ({ projects: projectStats(database()) });
