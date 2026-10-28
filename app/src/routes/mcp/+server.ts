import type { RequestHandler } from './$types';
import { mcpResponse } from '#lib/server/agent/mcp.js';

// Streamable HTTP uses POST for messages and GET and DELETE for streams and sessions.
export const fallback: RequestHandler = ({ request }) => mcpResponse(request);
