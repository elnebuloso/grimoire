import type { DatabaseSync } from 'node:sqlite';
import { McpServer, WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/server';
import { z } from 'zod';
import { GRIMOIRE_VERSION, INSTANCE_NAME } from '$app/env/private';
import type { SourceScope } from '../api-keys';
import { database } from '../db';
import { parseGrimoireId } from '../grimoire-id';
import { log } from '../log';
import { SERVER_FAILED, markdownResponse, scopeForRequest, unauthorizedResponse } from './http';
import {
	agentInstructions,
	agentQuery,
	idNotFound,
	indexSource,
	listVisibleSources,
	readById,
	type OperationResult
} from './operations';

/**
 * Runs a tool's operation. An unexpected error is logged and answered with the same neutral text
 * as over HTTP; left to the MCP SDK, its raw message would go to the agent and nowhere else.
 */
function toolResult(tool: string, operation: () => OperationResult) {
	let result: OperationResult;
	try {
		result = operation();
	} catch (error) {
		log.error({ err: error }, `MCP tool ${tool} failed`);
		result = { found: false, markdown: SERVER_FAILED };
	}
	return { content: [{ type: 'text' as const, text: result.markdown }], isError: !result.found };
}

/** An MCP server offering the agent operations within one API key's scope. */
export function createMcpServer(db: DatabaseSync, scope: SourceScope, name: string): McpServer {
	const server = new McpServer(
		{ name, version: GRIMOIRE_VERSION },
		{ instructions: agentInstructions(name) }
	);
	server.registerTool(
		'sources',
		{ description: 'Lists the documentation sources with their short description.' },
		() => toolResult('sources', () => listVisibleSources(db, scope))
	);
	server.registerTool(
		'index',
		{
			description: 'Lists the pages and sections of a source with their IDs.',
			inputSchema: z.object({ source: z.string() })
		},
		({ source }) => toolResult('index', () => indexSource(db, source, scope))
	);
	server.registerTool(
		'query',
		{
			description:
				'Searches all sources, or the given ones, and returns matching sections within a token budget.',
			inputSchema: z.object({
				query: z.string().trim().min(1),
				sources: z.array(z.string()).optional(),
				tokens: z.number().int().positive().optional().describe('Default 3000')
			})
		},
		(options) => toolResult('query', () => agentQuery(db, options, scope))
	);
	server.registerTool(
		'read',
		{
			description: 'Returns a page (`source/page`) or one section (`…#anchor`).',
			inputSchema: z.object({ id: z.string() })
		},
		({ id }) =>
			toolResult('read', () => {
				const location = parseGrimoireId(id);
				return location ? readById(db, location, scope) : idNotFound(id);
			})
	);
	return server;
}

/**
 * Answers an MCP request over Streamable HTTP. Stateless: every request gets its own server
 * and transport, so nothing is kept between requests and a revoked key stops working at once.
 */
export async function mcpResponse(request: Request): Promise<Response> {
	try {
		const db = database();
		const result = scopeForRequest(db, request);
		if (!result) return unauthorizedResponse();
		let parsedBody: unknown;
		try {
			parsedBody = JSON.parse(await request.text());
		} catch {
			return jsonRpcError(-32700, 'Parse error: Invalid JSON');
		}
		// The transport runs up to 100 batched calls in a row on the only thread; the limits of a
		// single query bound what one request costs only while a request holds one message.
		if (Array.isArray(parsedBody) && parsedBody.length > 1) {
			return jsonRpcError(-32600, 'Invalid Request: send one message per request, not a batch');
		}
		const transport = new WebStandardStreamableHTTPServerTransport({
			sessionIdGenerator: undefined,
			enableJsonResponse: true
		});
		await createMcpServer(db, result.scope, INSTANCE_NAME).connect(transport);
		return await transport.handleRequest(request, { parsedBody });
	} catch (error) {
		log.error({ err: error }, `${request.method} ${new URL(request.url).pathname} failed`);
		return markdownResponse(SERVER_FAILED, 500);
	}
}

/** A JSON-RPC error answered with 400, as the transport answers a message it cannot take. */
function jsonRpcError(code: number, message: string): Response {
	return Response.json({ jsonrpc: '2.0', error: { code, message }, id: null }, { status: 400 });
}
