import type { RequestHandler } from './$types';
import { agentResponse, queryOptions } from '#lib/server/agent/http.js';
import { queryProjects } from '#lib/server/agent/operations.js';

export const GET: RequestHandler = ({ request, url }) =>
	agentResponse(request, (db, scope) => queryProjects(db, queryOptions(url), scope));
