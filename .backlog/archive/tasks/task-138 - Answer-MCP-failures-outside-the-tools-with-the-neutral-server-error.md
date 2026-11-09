---
id: TASK-138
title: Answer MCP failures outside the tools with the neutral server error
status: Done
assignee:
  - '@claude'
created_date: '2026-10-30 10:55'
updated_date: '2026-10-30 11:14'
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
- [x] #1 An unexpected error in `mcpResponse` outside a tool is logged and answered with status 500 and the `SERVER_FAILED` text
- [x] #2 A test forces such a failure and checks status, body and the log call
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
Wrap the body of mcpResponse in try/catch: log "<method> <path> failed" like agentResponse and answer markdownResponse(SERVER_FAILED, 500). Test renames api_keys so scopeForRequest throws.
<!-- SECTION:PLAN:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
mcpResponse now catches errors outside the tools (scope lookup, transport), logs them as "POST /mcp failed" like the HTTP agent routes and answers 500 with the neutral SERVER_FAILED text instead of the SvelteKit default error page. New agent-api.spec test breaks the api_keys table and checks status, body and log call; it fails against the old code (the error escaped). 46 agent API specs pass.
<!-- SECTION:FINAL_SUMMARY:END -->
