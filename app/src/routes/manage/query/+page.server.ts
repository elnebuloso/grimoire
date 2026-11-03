import type { PageServerLoad } from './$types';
import { database } from '#lib/server/db/index.js';
import { readableSlugs } from '#lib/server/api-keys.js';
import { answerQueryForm } from '#lib/server/query-form.js';

// A GET form: a query has a URL to share, and reloading repeats it. It searches what a key of the
// user would read, an admin included.
export const load: PageServerLoad = ({ url, locals }) => {
	const db = database();
	const sources = readableSlugs(db, locals.user?.id ?? null);
	return answerQueryForm(db, url, sources, sources);
};
