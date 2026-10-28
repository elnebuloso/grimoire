import type { RequestHandler } from './$types';
import { agentResponse } from '#lib/server/agent/http.js';
import { listProjects } from '#lib/server/agent/operations.js';

export const GET: RequestHandler = ({ request }) =>
	agentResponse(request, (db, scope) => listProjects(db, scope));
