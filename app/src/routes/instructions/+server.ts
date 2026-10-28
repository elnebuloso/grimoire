import type { RequestHandler } from './$types';
import { agentResponse } from '#lib/server/agent/http.js';
import { agentInstructions } from '#lib/server/agent/operations.js';

export const GET: RequestHandler = ({ request }) =>
	agentResponse(request, () => ({ found: true, markdown: agentInstructions }));
