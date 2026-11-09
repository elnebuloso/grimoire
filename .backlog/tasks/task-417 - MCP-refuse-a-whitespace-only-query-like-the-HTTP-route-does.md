---
id: TASK-417
title: 'MCP: refuse a whitespace-only query like the HTTP route does'
status: To Do
assignee: []
created_date: '2026-11-09 10:17'
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
`z.string().trim().min(1)` in the MCP schema. Add a test that a whitespace-only query over MCP is rejected (the MCP tests sit with `app/src/lib/server/agent/`; `operations.spec.ts` or the MCP route spec).

### If we skip it
Agents get a misleading answer for an empty question; nothing else breaks.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 The MCP query tool rejects a query of only whitespace
- [ ] #2 A test covers it
<!-- AC:END -->
