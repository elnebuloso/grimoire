import type { RequestHandler } from './$types';
import { agentResponse } from '#lib/server/agent/http.js';
import { llmsTxt } from '#lib/server/agent/operations.js';
import { publicOrigin } from '#lib/server/public-origin.js';

export const GET: RequestHandler = ({ request, params, url }) =>
	agentResponse(request, (db, scope) => llmsTxt(db, params.project, scope, publicOrigin(url)));
