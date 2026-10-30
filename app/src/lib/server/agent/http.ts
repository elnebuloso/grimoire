import type { DatabaseSync } from 'node:sqlite';
import { scopeForKey, type ProjectScope } from '../api-keys';
import { database } from '../db';
import { log } from '../log';
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

/** Thrown by an operation for a request it cannot answer; the message is the Markdown 400. */
export class InvalidRequestError extends Error {}

/**
 * Answers an agent request: rejects it without a valid `Authorization: Bearer <key>`, otherwise
 * runs the operation within the key's scope. A result that was not found becomes a 404, an
 * `InvalidRequestError` a 400, and any other error is logged and becomes a 500.
 */
export function agentResponse(
	request: Request,
	operation: (db: DatabaseSync, scope: ProjectScope) => OperationResult
): Response {
	try {
		const db = database();
		const result = scopeForRequest(db, request);
		if (!result) return unauthorizedResponse();
		const answer = operation(db, result.scope);
		return markdownResponse(answer.markdown, answer.found ? 200 : 404);
	} catch (error) {
		if (error instanceof InvalidRequestError) return markdownResponse(error.message, 400);
		log.error({ err: error }, `${request.method} ${new URL(request.url).pathname} failed`);
		return markdownResponse('The server failed to answer. Try again later.', 500);
	}
}

/** The search options of `?q=&tokens=`; throws `InvalidRequestError` saying what is wrong. */
export function queryOptions(url: URL, project?: string): QueryOptions {
	const query = url.searchParams.get('q')?.trim();
	if (!query) throw new InvalidRequestError('Missing search terms. Send `?q=<terms>`.');
	const tokens = url.searchParams.get('tokens');
	if (tokens === null) return { query, project };
	if (!/^[1-9]\d*$/.test(tokens)) {
		throw new InvalidRequestError('`tokens` must be a positive whole number.');
	}
	return { query, project, tokens: Number(tokens) };
}
