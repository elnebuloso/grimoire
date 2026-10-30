---
id: TASK-138
title: Answer MCP failures outside the tools with the neutral server error
status: To Do
assignee: []
created_date: '2026-10-30 10:55'
labels:
  - agent-api
milestone: m-0
dependencies: []
priority: low
type: bug
ordinal: 200000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Found in the second whole-project code review of 2026-10-30. `mcpResponse` in `app/src/lib/server/agent/mcp.ts` (around lines 83-93) has no catch: a database failure in `scopeForRequest`, or an exception from the transport, ends in SvelteKit default error response. The HTTP transport, `agentResponse` in `app/src/lib/server/agent/http.ts` (around lines 50-65), logs such an error with the request and answers the neutral `SERVER_FAILED` text with 500. Errors inside MCP tools already get that text. Both transports should answer the same way; the error is logged by `handleError` today, so only the shape of the answer differs.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 An unexpected error in `mcpResponse` outside a tool is logged and answered with status 500 and the `SERVER_FAILED` text
- [ ] #2 A test forces such a failure and checks status, body and the log call
<!-- AC:END -->
