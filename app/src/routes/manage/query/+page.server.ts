import type { PageServerLoad } from './$types';
import { database } from '#lib/server/db/index.js';
import { listSources } from '#lib/server/admin/sources.js';
import { querySources } from '#lib/server/agent/operations.js';
import { DEFAULT_TOKENS, parseTokenBudget } from '#lib/server/search/query.js';
import { m } from '#lib/paraglide/messages.js';

// A GET form: a query has a URL to share, and reloading repeats it.
export const load: PageServerLoad = ({ url }) => {
	const db = database();
	const sources = listSources(db).map((source) => source.slug);
	const question = url.searchParams.get('q');
	const values = {
		question: question ?? '',
		sources: url.searchParams.getAll('source'),
		tokens: url.searchParams.get('tokens') || String(DEFAULT_TOKENS)
	};
	if (question === null) return { sources, values };
	if (!question.trim()) return { sources, values, error: m.query_error_question() };
	const tokens = parseTokenBudget(values.tokens);
	if (tokens === undefined) return { sources, values, error: m.query_error_tokens() };

	const result = querySources(
		db,
		{
			query: question.trim(),
			sources: values.sources.length > 0 ? values.sources : undefined,
			tokens
		},
		'all'
	);
	return { sources, values, answer: result.markdown };
};
