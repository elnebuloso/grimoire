import type { PageServerLoad } from './$types';
import { database } from '#lib/server/db/index.js';
import { listMissedQueries } from '#lib/server/missed-queries.js';
import { listPage, readListParams, type ListSpec } from '#lib/list.js';

type Query = ReturnType<typeof listMissedQueries>[number];

const QUERY_LIST: ListSpec<Query> = {
	search: (query) => query.question,
	sorts: {
		question: (query) => query.question,
		count: (query) => query.count,
		asked: (query) => query.lastAskedAt
	},
	defaultSort: '-asked'
};

export const load: PageServerLoad = ({ url }) => {
	const params = readListParams(url, QUERY_LIST);
	return {
		queries: listPage(listMissedQueries(database()), params, QUERY_LIST),
		filtered: params.search !== ''
	};
};
