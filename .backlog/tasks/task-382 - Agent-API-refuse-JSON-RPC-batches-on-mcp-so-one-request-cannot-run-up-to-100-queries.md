---
id: TASK-382
title: >-
  Agent API: refuse JSON-RPC batches on /mcp so one request cannot run up to 100
  queries
status: Done
assignee:
  - '@claude'
created_date: '2026-11-08 16:44'
updated_date: '2026-11-08 17:20'
labels:
  - agent-api
dependencies: []
priority: high
type: bug
ordinal: 444000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
`mcpResponse` in `app/src/lib/server/agent/mcp.ts:86-100` hands every POST to `/mcp` unchecked to `WebStandardStreamableHTTPServerTransport` from `@modelcontextprotocol/server`. The transport accepts JSON-RPC batches of up to 100 messages (`MAX_BATCH_SIZE` in `app/node_modules/@modelcontextprotocol/server/dist/index.mjs`), and in stateless mode no `initialize` is needed first. Requests without an API key are allowed and read the public sources.

Case: one POST with a JSON array of 100 `tools/call` messages for `query`, each with 16 long common words. All 100 searches run synchronously on the single server thread; one 16-term FTS5 query with bm25 ordering took about 340 ms on a synthetic table of 100,000 rows, so one request blocks every other agent and page for tens of seconds. The limits of 500 characters and 16 search terms per question (`app/src/lib/server/agent/operations.ts:143`, `app/src/lib/server/search/query.ts:325`) exist to bound the cost of one query; a batch multiplies past them. No agent route has a rate limit, and `scopeForKey` counts the whole POST as one request.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 A POST to /mcp whose body is a JSON array with more than one message is answered with 400 and runs nothing
- [x] #2 A single message, as every MCP client sends, works as before (the body parsed once and passed on with transport.handleRequest(request, { parsedBody }))
- [x] #3 A spec shows that a batch of two query calls is refused and a single call is answered
- [x] #4 docs/handbook/agents.md says that /mcp accepts one message per request, if it describes the MCP transport at that level
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. mcpResponse reads and parses the body once, refuses an array of more than one message with 400 (-32600) before a server or transport exists, and passes the body on with handleRequest(request, { parsedBody }).
2. Spec in agent-api.spec.ts; one sentence in docs/handbook/agents.md.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Invalid JSON is answered as the transport did (400, -32700 'Parse error: Invalid JSON'). With parsedBody the transport's own 4 MiB body bound no longer applies; adapter-node's BODY_SIZE_LIMIT (512K by default) bounds the body before it. The spec proves nothing ran through missed queries (a query without results is recorded), since a spy cannot reach the module-internal import. Fails before, passes after; agent-api.spec.ts: 53 passed.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
POST /mcp now refuses a JSON-RPC batch of more than one message with 400 and runs none of it, so one request can no longer run up to 100 queries on the single thread. Single messages work as before, with the body parsed once and handed to the transport. Spec in agent-api.spec.ts; handbook says one message per request.
<!-- SECTION:FINAL_SUMMARY:END -->
