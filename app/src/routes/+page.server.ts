import type { PageServerLoad } from './$types';
import { database } from '#lib/server/db/index.js';
import { answerQueryForm } from '#lib/server/query-form.js';
import { sourceStats } from '#lib/server/stats.js';
import { publicOrigin } from '#lib/server/public-origin.js';

export const load: PageServerLoad = ({ url }) => {
	const db = database();
	const sources = sourceStats(db);
	const publicSources = sources.filter((source) => source.public).map((source) => source.slug);
	return {
		sources,
		// Only public sources are searched here, whoever is logged in.
		query: publicSources.length > 0 ? answerQueryForm(db, url, publicSources, 'public') : undefined,
		origin: publicOrigin(url)
	};
};
