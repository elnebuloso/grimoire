import type { RequestHandler } from './$types';
import { agentResponse } from '#lib/server/agent/http.js';
import { indexSource } from '#lib/server/agent/operations.js';

export const GET: RequestHandler = ({ request, params }) =>
	agentResponse(request, (db, scope) => indexSource(db, params.source, scope));
