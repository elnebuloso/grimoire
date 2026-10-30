import type { RequestHandler } from './$types';
import { mcpResponse } from '#lib/server/agent/mcp.js';
import { markdownResponse } from '#lib/server/agent/http.js';

export const POST: RequestHandler = ({ request }) => mcpResponse(request);

// The server is stateless, so it has no sessions to end and no stream that a later message
// could reach; a GET stream would stay open for nothing. Streamable HTTP allows 405 for both.
export const fallback: RequestHandler = () =>
	markdownResponse('The MCP endpoint accepts POST only.', 405, { Allow: 'POST' });
