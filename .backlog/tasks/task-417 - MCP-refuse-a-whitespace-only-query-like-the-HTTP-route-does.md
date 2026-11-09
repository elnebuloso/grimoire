---
id: TASK-417
title: 'MCP: refuse a whitespace-only query like the HTTP route does'
status: Done
assignee:
  - '@claude'
created_date: '2026-11-09 10:17'
updated_date: '2026-11-09 10:53'
labels:
  - agent-api
dependencies: []
priority: low
type: bug
ordinal: 479000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
### What this is
The MCP tool `query` (`app/src/lib/server/agent/mcp.ts`) validates its input with `query: z.string().min(1)`; the HTTP route `/query` refuses a question without search terms with 400 `Missing search terms. Send ?q=<terms>.`

### Problem
Over MCP, `{"query":"   "}` passes `min(1)`, is trimmed to `''` (`normalizeQueryOptions` in `app/src/lib/server/agent/operations.ts`) and answers `No results for "". Try other terms…` without `isError`. The agent gets a misleading "no results" instead of being told its question was empty.

### Fix
`z.string().trim().min(1)` in the MCP schema. Add a test to `describe('POST /mcp')` in `app/src/routes/agent-api.spec.ts` (it already builds MCP requests): a `tools/call` of `query` with `"   "` returns an error, not `No results`.

### If we skip it
Agents get a misleading answer for an empty question; nothing else breaks.

### Notes for the implementer
- Commit type: `fix` (released behaviour changes), so pushing it cuts a release; afterwards write the release-notes summary per `.claude/rules/release-notes.md`.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 The MCP query tool rejects a query of only whitespace
- [x] #2 A test covers it
<!-- AC:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
The MCP query tool's schema is now z.string().trim().min(1), so a question of only whitespace is refused as a tool error instead of answering 'No results for ""'. Regression test in agent-api.spec.ts (POST /mcp), confirmed to fail without the fix.
<!-- SECTION:FINAL_SUMMARY:END -->
