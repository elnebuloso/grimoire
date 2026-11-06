import type { PageServerLoad } from './$types';
import { database } from '#lib/server/db/index.js';
import { answerQueryForm } from '#lib/server/query-form.js';
import { sourceStats } from '#lib/server/stats.js';
import { SOURCE_LIST } from '#lib/server/source-list.js';
import { listPage, readListParams } from '#lib/list.js';
import { allSlugs } from '#lib/server/api-keys.js';
import { connectTarget } from '#lib/server/connect.js';

export const load: PageServerLoad = ({ url, locals }) => {
	const db = database();
	// A visitor sees the public sources, a user every one.
	const readable = locals.user ? allSlugs(db) : undefined;
	const sources = sourceStats(db).filter((source) =>
		readable ? readable.includes(source.slug) : source.visibility === 'public'
	);
	const params = readListParams(url, SOURCE_LIST);
	return {
		sources: listPage(sources, params, SOURCE_LIST),
		filtered: params.search !== '' || Object.keys(params.filters).length > 0,
		// Everything listed, the same as an API key of the user reads; for a visitor the public sources.
		query: sources.length > 0 ? answerQueryForm(db, url, readable ?? 'public') : undefined,
		...connectTarget(url)
	};
};
