import type { PageServerLoad } from './$types';
import { database } from '#lib/server/db/index.js';
import { listSources } from '#lib/server/admin/sources.js';
import { answerQueryForm } from '#lib/server/query-form.js';

// A GET form: a query has a URL to share, and reloading repeats it.
export const load: PageServerLoad = ({ url }) => {
	const db = database();
	const sources = listSources(db).map((source) => source.slug);
	return answerQueryForm(db, url, sources, 'all');
};
