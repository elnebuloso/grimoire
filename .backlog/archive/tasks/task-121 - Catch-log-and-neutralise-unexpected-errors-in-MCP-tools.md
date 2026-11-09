---
id: TASK-121
title: 'Catch, log and neutralise unexpected errors in MCP tools'
status: Done
assignee:
  - '@claude'
created_date: '2026-10-30 09:45'
updated_date: '2026-10-30 09:58'
labels:
  - agent-api
milestone: m-0
dependencies: []
priority: high
type: bug
ordinal: 183000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Found in the whole-project code review of 2026-10-30. The HTTP agent routes go through `agentResponse` in `app/src/lib/server/agent/http.ts` (lines 240-255): an unexpected error is logged with the request path and answered with a neutral 500 ("The server failed to answer. Try again later."). The MCP tools in `app/src/lib/server/agent/mcp.ts` (lines 287-331) call the same operations without a wrapper. The MCP SDK catches the exception itself (`createToolError(error.message)` in `@modelcontextprotocol/server`) and returns the raw `error.message` as tool text. So an `SQLITE_BUSY` after the busy timeout, a `JSON.parse` failure on a damaged `title_path`, or an SQL error from a migration mistake reaches every API key holder word for word, and never appears in the log. MCP is the transport the start page recommends, so most agent-side failures happen where they are least visible: undiagnosable from the log, and internal details cross the trust boundary that the HTTP side guards. Both transports should share one error policy written in one place.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 An unexpected exception in any MCP tool is logged like an HTTP agent error (with the tool name in place of the path)
- [ ] #2 The MCP tool result for an unexpected exception is `isError: true` with the same neutral text the HTTP side returns, never the exception message
- [ ] #3 Expected refusals (unknown project, invalid input) still return their specific messages on both transports
- [ ] #4 A test forces an operation to throw and checks both the MCP result text and the log entry
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
Wrap every MCP tool operation in toolResult(tool, operation): catch, log 'MCP tool <name> failed' and answer SERVER_FAILED (shared constant in http.ts) with isError true. Test by renaming the snippets table under a query.
<!-- SECTION:PLAN:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
MCP tools now run through toolResult(tool, operation), which logs an unexpected error and returns the neutral text SERVER_FAILED with isError: true. HTTP uses the same constant. Not-found refusals keep their messages (existing tests). New test breaks the snippets table, then checks the MCP text and the log call; it fails against the old code.
<!-- SECTION:FINAL_SUMMARY:END -->
