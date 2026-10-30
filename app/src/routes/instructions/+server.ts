import type { RequestHandler } from './$types';
import { INSTANCE_NAME } from '$app/env/private';
import { agentResponse } from '#lib/server/agent/http.js';
import { agentInstructions } from '#lib/server/agent/operations.js';

export const GET: RequestHandler = ({ request }) =>
	agentResponse(request, () => ({ found: true, markdown: agentInstructions(INSTANCE_NAME) }));
