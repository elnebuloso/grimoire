import type { DatabaseSync } from 'node:sqlite';
import type { SourceScope } from './api-keys';
import { querySources } from './agent/operations';
import { DEFAULT_TOKENS, parseTokenBudget } from './search/query';
import { m } from '#lib/paraglide/messages.js';

export interface QueryFormValues {
	question: string;
	sources: string[];
	tokens: string;
}

export interface QueryFormState {
	/** The slugs the form offers to tick. */
	sources: string[];
	values: QueryFormValues;
	error?: string;
	answer?: string;
}

/**
 * The query form of `?q=&source=&tokens=` as sent by GET, answered like the agent operation
 * `query` within `scope`, without recording a query that found nothing. No `q` means the form was
 * not sent yet.
 */
export function answerQueryForm(
	db: DatabaseSync,
	url: URL,
	sources: string[],
	scope: SourceScope
): QueryFormState {
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
			query: question,
			sources: values.sources,
			tokens
		},
		scope
	);
	return { sources, values, answer: result.markdown };
}
