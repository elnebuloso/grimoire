import type { DatabaseSync } from 'node:sqlite';
import { TZ } from '$app/env/private';
import { dateIn } from '#lib/time-zone.js';
import { scopeForKey, type SourceScope } from '../api-keys';
import { database } from '../db';
import { log } from '../log';
import { parseTokenBudget } from '../search/query';
import type { OperationResult, QueryOptions } from './operations';

/** The answer to an unexpected error, on every transport: its message is for the log only. */
export const SERVER_FAILED = 'The server failed to answer. Try again later.';

/** A Markdown response, the only format the agent HTTP API answers in. */
export function markdownResponse(markdown: string, status = 200, headers: HeadersInit = {}) {
	return new Response(markdown, {
		status,
		headers: { 'Content-Type': 'text/markdown; charset=utf-8', ...headers }
	});
}

/**
 * The scope of the `Authorization: Bearer <key>` of a request, or undefined when the key is
 * unknown or expired. Without a key, the request sees the public sources; undefined while there
 * is none, so an instance without public sources asks for a key as before.
 */
export function scopeForRequest(
	db: DatabaseSync,
	request: Request
): { scope: SourceScope } | undefined {
	const authorization = request.headers.get('Authorization');
	if (authorization === null) return hasPublicSource(db) ? { scope: 'public' } : undefined;
	const key = authorization.match(/^Bearer (.+)$/i)?.[1];
	if (!key) return undefined;
	const now = new Date();
	return scopeForKey(db, key, { now, today: dateIn(TZ, now) });
}

function hasPublicSource(db: DatabaseSync): boolean {
	return db.prepare('SELECT 1 FROM sources WHERE public = 1 LIMIT 1').get() !== undefined;
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
 * Answers an agent request: rejects an invalid `Authorization: Bearer <key>`, otherwise runs the
 * operation within the key's scope, or within the public sources for a request without a key. A
 * result that was not found becomes a 404, an `InvalidRequestError` a 400, and any other error is
 * logged and becomes a 500.
 */
export function agentResponse(
	request: Request,
	operation: (db: DatabaseSync, scope: SourceScope) => OperationResult
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
		return markdownResponse(SERVER_FAILED, 500);
	}
}

/**
 * The search options of `?q=&source=&tokens=`, `source` repeated for several sources; throws
 * `InvalidRequestError` saying what is wrong.
 */
export function queryOptions(url: URL): QueryOptions {
	const query = url.searchParams.get('q')?.trim();
	if (!query) throw new InvalidRequestError('Missing search terms. Send `?q=<terms>`.');
	const sources = url.searchParams.getAll('source');
	const tokens = url.searchParams.get('tokens');
	if (tokens === null) return { query, sources };
	const budget = parseTokenBudget(tokens);
	if (budget === undefined) {
		throw new InvalidRequestError('`tokens` must be a positive whole number.');
	}
	return { query, sources, tokens: budget };
}
