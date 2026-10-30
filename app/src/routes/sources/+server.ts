import type { RequestHandler } from './$types';
import { agentResponse } from '#lib/server/agent/http.js';
import { listVisibleSources } from '#lib/server/agent/operations.js';

export const GET: RequestHandler = ({ request }) =>
	agentResponse(request, (db, scope) => listVisibleSources(db, scope));
