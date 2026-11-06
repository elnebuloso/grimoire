import type { DatabaseSync } from 'node:sqlite';
import type { SourceScope } from './api-keys';
import { querySources } from './agent/operations';
import { DEFAULT_TOKENS, parseTokenBudget } from './search/query';
import { grimoireId } from './grimoire-id';
import { m } from '#lib/paraglide/messages.js';
import type { Refusal } from '#lib/forms.js';

export interface QueryFormValues {
	question: string;
	tokens: string;
}

/** A hit as the page shows it: no Git URL or branch, which the raw answer redacts. */
export interface QueryFormHit {
	/** The grimoire ID an agent reads it by. */
	id: string;
	titlePath: string[];
	content: string;
}

export interface QueryFormAnswer {
	hits: QueryFormHit[];
	/** Hits that did not fit the token budget. */
	skipped: number;
	/** The answer exactly as an agent gets it. */
	raw: string;
}

export interface QueryFormState {
	values: QueryFormValues;
	/** Why the question was not asked; `field` is the name of the input it is about. */
	refusal?: Refusal;
	answer?: QueryFormAnswer;
}

/**
 * The query form of `?q=&tokens=` as sent by GET, answered like the agent operation `query`
 * across all of `scope`, without recording a query that found nothing. No `q` means the form was
 * not sent yet.
 */
export function answerQueryForm(db: DatabaseSync, url: URL, scope: SourceScope): QueryFormState {
	const question = url.searchParams.get('q');
	const values = {
		question: question ?? '',
		tokens: url.searchParams.get('tokens') || String(DEFAULT_TOKENS)
	};
	if (question === null) return { values };
	if (!question.trim()) return { values, refusal: { error: m.query_error_question(), field: 'q' } };
	const tokens = parseTokenBudget(values.tokens);
	if (tokens === undefined) {
		return { values, refusal: { error: m.query_error_tokens(), field: 'tokens' } };
	}

	const result = querySources(db, { query: question, tokens }, scope);
	const hits = result.hits.map((hit) => ({
		id: grimoireId(hit, hit.anchor),
		titlePath: hit.titlePath,
		content: hit.content.trimEnd()
	}));
	return { values, answer: { hits, skipped: result.skipped.length, raw: result.markdown } };
}
