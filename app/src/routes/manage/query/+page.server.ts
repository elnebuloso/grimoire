import type { PageServerLoad } from './$types';
import { database } from '#lib/server/db/index.js';
import { listProjects } from '#lib/server/admin/projects.js';
import { queryProjects } from '#lib/server/agent/operations.js';
import { DEFAULT_TOKENS, parseTokenBudget } from '#lib/server/search/query.js';
import { m } from '#lib/paraglide/messages.js';

// A GET form: a query has a URL to share, and reloading repeats it.
export const load: PageServerLoad = ({ url }) => {
	const db = database();
	const projects = listProjects(db).map((project) => project.slug);
	const question = url.searchParams.get('q');
	const values = {
		question: question ?? '',
		project: url.searchParams.get('project') ?? '',
		tokens: url.searchParams.get('tokens') || String(DEFAULT_TOKENS)
	};
	if (question === null) return { projects, values };
	if (!question.trim()) return { projects, values, error: m.query_error_question() };
	const tokens = parseTokenBudget(values.tokens);
	if (tokens === undefined) return { projects, values, error: m.query_error_tokens() };

	const result = queryProjects(
		db,
		{ query: question.trim(), project: values.project || undefined, tokens },
		'all'
	);
	return { projects, values, answer: result.markdown };
};
