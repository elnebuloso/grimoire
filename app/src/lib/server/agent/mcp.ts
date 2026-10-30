import type { DatabaseSync } from 'node:sqlite';
import { McpServer, WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/server';
import { z } from 'zod';
import { version } from '../../../../package.json';
import type { ProjectScope } from '../api-keys';
import { database } from '../db';
import { parseGrimoireId } from '../grimoire-id';
import { log } from '../log';
import { SERVER_FAILED, scopeForRequest, unauthorizedResponse } from './http';
import {
	agentInstructions,
	agentQuery,
	idNotFound,
	indexProject,
	listVisibleProjects,
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
export function createMcpServer(db: DatabaseSync, scope: ProjectScope): McpServer {
	const server = new McpServer({ name: 'grimoire', version }, { instructions: agentInstructions });
	server.registerTool(
		'projects',
		{ description: 'Lists the projects with their short description.' },
		() => toolResult('projects', () => listVisibleProjects(db, scope))
	);
	server.registerTool(
		'index',
		{
			description: 'Lists the pages and sections of a project with their IDs.',
			inputSchema: z.object({ project: z.string() })
		},
		({ project }) => toolResult('index', () => indexProject(db, project, scope))
	);
	server.registerTool(
		'query',
		{
			description:
				'Searches all projects, or one, and returns matching sections within a token budget.',
			inputSchema: z.object({
				query: z.string().min(1),
				project: z.string().optional(),
				tokens: z.number().int().positive().optional().describe('Default 3000')
			})
		},
		(options) => toolResult('query', () => agentQuery(db, options, scope))
	);
	server.registerTool(
		'read',
		{
			description: 'Returns a page (`project/source/page`) or one section (`…#anchor`).',
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
	const db = database();
	const result = scopeForRequest(db, request);
	if (!result) return unauthorizedResponse();
	const transport = new WebStandardStreamableHTTPServerTransport({
		sessionIdGenerator: undefined,
		enableJsonResponse: true
	});
	await createMcpServer(db, result.scope).connect(transport);
	return transport.handleRequest(request);
}
