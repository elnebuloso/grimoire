---
id: TASK-13
title: MCP server
status: Done
assignee:
  - '@claude'
created_date: '2026-10-28T19:32:00Z'
updated_date: '2026-10-28T22:07:00Z'
labels:
  - agent-api
milestone: m-0
dependencies:
  - TASK-10
  - TASK-11
documentation:
  - docs/konzept.md
priority: high
type: feature
ordinal: 13000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
MCP is the main channel for agents: connect with URL and API key, nothing to install, works in Claude Code, Claude Desktop, claude.ai, Cursor and others. The server instructions land in agent context automatically, so no `CLAUDE.md` block is needed.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 MCP server runs in the same app via the official TypeScript SDK over Streamable HTTP
- [x] #2 Tools `projects`, `index`, `query` and `read` are offered; `read` accepts IDs with `#anchor`
- [x] #3 Server instructions are the same text as `GET /instructions`
- [x] #4 Access requires a valid API key and respects its scope
- [x] #5 Verified by connecting a real MCP client and calling each tool
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Install @modelcontextprotocol/server 2.3.1 (v2, the stable SDK line; newest 2.4.0 under two weeks old), pinned exactly.
2. app/src/lib/server/agent/mcp.ts: createMcpServer(db, scope) registers projects, index, query, read on an McpServer with agentInstructions as server instructions; each tool calls the operation from operations.ts and returns its Markdown as text, found:false as isError.
3. Route app/src/routes/mcp/+server.ts: Bearer key via the same check as the HTTP API (shared from agent/http.ts), 401 otherwise; stateless WebStandardStreamableHTTPServerTransport, one server and transport per request.
4. Tests via the SDK's in-memory transport or HTTP requests: tool list, each tool, read with #anchor, scope, 401.
5. Verify with the MCP Inspector CLI against the production build, one call per tool; make test, make lint.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Decided with the user: SDK v2 @modelcontextprotocol/server 2.3.1; AC #5 verified with the MCP Inspector CLI.

Stateless Streamable HTTP with JSON responses (enableJsonResponse): one server and transport per request, no sessions to keep, a revoked key fails on the next request. Unknown and out-of-scope IDs are tool results with isError, not protocol errors. The key check is shared with the HTTP API (scopeForRequest, unauthorizedResponse in agent/http.ts).

Verified with MCP Inspector CLI 2.11.0 against the production build, synced from a local file:// repo: tools/list shows all four tools; projects, index, query (with tokens), read with #anchor and an ID with a space answer; an unknown ID returns isError. Without a key the Inspector answers the 401 + WWW-Authenticate: Bearer by starting OAuth discovery; grimoire has no OAuth, so clients must send the key as a header. Whether clients that only connect via OAuth (e.g. connector UIs) can use grimoire is not checked.

Decided with the user: access by API key only is enough; no OAuth, and no task for OAuth-only clients.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Added the MCP server at /mcp (app/src/routes/mcp/+server.ts) with SDK v2 @modelcontextprotocol/server 2.3.1 over stateless Streamable HTTP. createMcpServer in agent/mcp.ts registers projects, index, query and read on top of operations.ts, with agentInstructions as server instructions; not-found results come back as isError. Access needs the same Bearer key as the HTTP API (key check moved into scopeForRequest/unauthorizedResponse in agent/http.ts) and respects its scope. Tests (6 new) in app/src/routes/agent-api.spec.ts; make test (172 passed) and make lint green; checked end to end with the MCP Inspector CLI. Open: clients that only support OAuth are not covered.
<!-- SECTION:FINAL_SUMMARY:END -->
