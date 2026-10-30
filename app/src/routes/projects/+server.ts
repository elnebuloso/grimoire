import type { RequestHandler } from './$types';
import { agentResponse } from '#lib/server/agent/http.js';
import { listVisibleProjects } from '#lib/server/agent/operations.js';

export const GET: RequestHandler = ({ request }) =>
	agentResponse(request, (db, scope) => listVisibleProjects(db, scope));
