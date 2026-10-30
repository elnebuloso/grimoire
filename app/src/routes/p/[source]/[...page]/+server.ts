import type { RequestHandler } from './$types';
import { agentResponse } from '#lib/server/agent/http.js';
import { readById } from '#lib/server/agent/operations.js';

// HTTP clients never send the `#anchor` of an ID, so a section arrives as `?section=anchor`.
export const GET: RequestHandler = ({ request, params, url }) =>
	agentResponse(request, (db, scope) => {
		const section = {
			source: params.source,
			file: `${params.page}.md`,
			anchor: url.searchParams.get('section')
		};
		return readById(db, section, scope);
	});
