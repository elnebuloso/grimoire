import type { PageServerLoad } from './$types';
import { database } from '#lib/server/db/index.js';
import { listMissedQueries } from '#lib/server/missed-queries.js';

export const load: PageServerLoad = () => ({ queries: listMissedQueries(database()) });
