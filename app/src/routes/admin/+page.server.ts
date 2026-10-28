import type { PageServerLoad } from './$types';
import { database } from '#lib/server/db/index.js';
import { listProjects } from '#lib/server/admin/projects.js';

export const load: PageServerLoad = () => ({ projects: listProjects(database()) });
