import type { PageServerLoad } from './$types';
import { database } from '#lib/server/db/index.js';
import { answerQueryForm } from '#lib/server/query-form.js';
import { sourceStats, type SourceStats } from '#lib/server/stats.js';
import { listPage, readListParams, type ListSpec } from '#lib/list.js';
import { allSlugs } from '#lib/server/api-keys.js';
import { connectTarget } from '#lib/server/connect.js';

/** What the start page tells anyone about a source: the state of its content, no sync details. */
type CatalogSource = Pick<
	SourceStats,
	| 'id'
	| 'slug'
	| 'name'
	| 'description'
	| 'visibility'
	| 'docsUrl'
	| 'pages'
	| 'snippets'
	| 'tokens'
	| 'lastSync'
>;

const CATALOG: ListSpec<CatalogSource> = {
	search: (source) => `${source.name} ${source.slug} ${source.description}`,
	filters: { visibility: (source) => source.visibility },
	sorts: { name: (source) => source.name, updated: (source) => source.lastSync }
};

export const load: PageServerLoad = ({ url, locals }) => {
	const db = database();
	// A visitor sees the public sources, a user every one.
	const readable = locals.user ? allSlugs(db) : undefined;
	const sources: CatalogSource[] = sourceStats(db)
		.filter((source) =>
			readable ? readable.includes(source.slug) : source.visibility === 'public'
		)
		.map(
			({
				id,
				slug,
				name,
				description,
				visibility,
				docsUrl,
				pages,
				snippets,
				tokens,
				lastSync
			}) => ({
				id,
				slug,
				name,
				description,
				visibility,
				docsUrl,
				pages,
				snippets,
				tokens,
				lastSync
			})
		);
	const params = readListParams(url, CATALOG);
	return {
		sources: listPage(sources, params, CATALOG),
		filtered: params.search !== '' || Object.keys(params.filters).length > 0,
		// Everything listed, the same as an API key of the user reads; for a visitor the public sources.
		query: sources.length > 0 ? answerQueryForm(db, url, readable ?? 'public') : undefined,
		...connectTarget(url)
	};
};
