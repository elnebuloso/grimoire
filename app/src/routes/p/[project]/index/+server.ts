import type { RequestHandler } from './$types';
import { agentResponse } from '#lib/server/agent/http.js';
import { indexProject } from '#lib/server/agent/operations.js';

export const GET: RequestHandler = ({ request, params }) =>
	agentResponse(request, (db, scope) => indexProject(db, params.project, scope));
