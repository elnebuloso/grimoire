import type { DatabaseSync } from 'node:sqlite';
import { scopeForKey, type ProjectScope } from '../api-keys';
import { database } from '../db';
import type { OperationResult, QueryOptions } from './operations';

/** A Markdown response, the only format the agent HTTP API answers in. */
export function markdownResponse(markdown: string, status = 200, headers: HeadersInit = {}) {
	return new Response(markdown, {
		status,
		headers: { 'Content-Type': 'text/markdown; charset=utf-8', ...headers }
	});
}

/**
 * The scope of the `Authorization: Bearer <key>` of a request, or undefined when the key is
 * missing or unknown.
 */
export function scopeForRequest(
	db: DatabaseSync,
	request: Request
): { scope: ProjectScope } | undefined {
	const key = request.headers.get('Authorization')?.match(/^Bearer (.+)$/i)?.[1];
	return key ? scopeForKey(db, key) : undefined;
}

/** The 401 for a request without a valid API key. */
export function unauthorizedResponse(): Response {
	return markdownResponse('Missing or invalid API key. Send `Authorization: Bearer <key>`.', 401, {
		'WWW-Authenticate': 'Bearer'
	});
}

/**
 * Answers an agent request: rejects it without a valid `Authorization: Bearer <key>`, otherwise
 * runs the operation within the key's scope. A result that was not found becomes a 404.
 */
export function agentResponse(
	request: Request,
	operation: (db: DatabaseSync, scope: ProjectScope) => OperationResult | Response
): Response {
	const db = database();
	const result = scopeForRequest(db, request);
	if (!result) return unauthorizedResponse();
	const answer = operation(db, result.scope);
	if (answer instanceof Response) return answer;
	return markdownResponse(answer.markdown, answer.found ? 200 : 404);
}

/** The search options of `?q=&tokens=`, or a 400 response saying what is wrong with them. */
export function queryOptions(url: URL, project?: string): QueryOptions | Response {
	const query = url.searchParams.get('q')?.trim();
	if (!query) return markdownResponse('Missing search terms. Send `?q=<terms>`.', 400);
	const tokens = url.searchParams.get('tokens');
	if (tokens === null) return { query, project };
	if (!/^[1-9]\d*$/.test(tokens)) {
		return markdownResponse('`tokens` must be a positive whole number.', 400);
	}
	return { query, project, tokens: Number(tokens) };
}
