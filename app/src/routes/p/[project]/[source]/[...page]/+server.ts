import type { RequestHandler } from './$types';
import { agentResponse } from '#lib/server/agent/http.js';
import { readById } from '#lib/server/agent/operations.js';
import { grimoireId } from '#lib/server/grimoire-id.js';

// HTTP clients never send the `#anchor` of an ID, so a section arrives as `?section=anchor`.
export const GET: RequestHandler = ({ request, params, url }) =>
	agentResponse(request, (db, scope) => {
		const page = { project: params.project, source: params.source, file: `${params.page}.md` };
		return readById(db, grimoireId(page, url.searchParams.get('section')), scope);
	});
