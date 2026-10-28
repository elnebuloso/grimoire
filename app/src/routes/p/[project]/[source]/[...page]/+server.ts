import type { RequestHandler } from './$types';
import { agentResponse } from '#lib/server/agent/http.js';
import { readById } from '#lib/server/agent/operations.js';

// HTTP clients never send the `#anchor` of an ID, so a section arrives as `?section=anchor`.
export const GET: RequestHandler = ({ request, params, url }) =>
	agentResponse(request, (db, scope) => {
		const section = url.searchParams.get('section');
		const id = `${params.project}/${params.source}/${params.page}`;
		return readById(db, section ? `${id}#${section}` : id, scope);
	});
