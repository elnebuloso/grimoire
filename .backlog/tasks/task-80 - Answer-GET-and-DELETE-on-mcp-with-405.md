---
id: TASK-80
title: Answer GET and DELETE on /mcp with 405
status: To Do
assignee: []
created_date: '2026-10-30 01:33'
labels:
  - agent-api
milestone: m-0
dependencies: []
references:
  - app/src/routes/mcp/+server.ts
  - app/src/lib/server/agent/mcp.ts
  - app/src/routes/agent-api.spec.ts
priority: high
type: bug
ordinal: 142000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Found by a code review on 2026-10-30.

`app/src/routes/mcp/+server.ts` hands every HTTP method to the MCP transport; its comment says GET and DELETE carry "streams and sessions". But `mcpResponse` in `app/src/lib/server/agent/mcp.ts` builds a fresh `McpServer` and a stateless transport (`sessionIdGenerator: undefined`) per request, so there are no sessions and no later message can ever reach a stream.

In the installed SDK (`@modelcontextprotocol/server` 2.3.1, `node_modules/@modelcontextprotocol/server/dist/index.mjs`) `validateSession` returns early when there is no generator, and `handleGetRequest` then opens a standalone `text/event-stream` with a keep-alive timer. The Streamable HTTP spec lets clients open that GET stream. Every key holder that does keeps a connection, an `McpServer`, a transport and an interval timer alive until it disconnects; behind a proxy with an idle timeout it reconnects in a loop. The client gains nothing. Not anonymous DoS (needs a key), but a leak that grows with every connected agent.

The spec allows a server without a standalone stream to answer GET with 405 Method Not Allowed. This was derived from reading the SDK source, not from a live request; confirm with `GET /mcp` + `Accept: text/event-stream` against the agent environment. The existing test `agent-api.spec.ts` covers POST only.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 GET /mcp (with Accept: text/event-stream and a valid key) answers 405 at once instead of opening an event stream
- [ ] #2 DELETE /mcp answers 405
- [ ] #3 POST /mcp keeps working as before
- [ ] #4 The comment in app/src/routes/mcp/+server.ts no longer claims streams and sessions
- [ ] #5 A test fails on the old code: GET with Accept: text/event-stream gets 405
<!-- AC:END -->
