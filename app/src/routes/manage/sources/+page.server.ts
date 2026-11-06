import type { PageServerLoad } from './$types';
import { database } from '#lib/server/db/index.js';
import { sourceStats } from '#lib/server/stats.js';

export const load: PageServerLoad = () => ({ sources: sourceStats(database()) });
