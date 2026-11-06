import type { PageServerLoad } from './$types';
import { database } from '#lib/server/db/index.js';
import { sourceStats } from '#lib/server/stats.js';
import { SOURCE_LIST } from '#lib/server/source-list.js';
import { listPage, readListParams } from '#lib/list.js';

export const load: PageServerLoad = ({ url }) => {
	const params = readListParams(url, SOURCE_LIST);
	return {
		sources: listPage(sourceStats(database()), params, SOURCE_LIST),
		filtered: params.search !== '' || Object.keys(params.filters).length > 0
	};
};
