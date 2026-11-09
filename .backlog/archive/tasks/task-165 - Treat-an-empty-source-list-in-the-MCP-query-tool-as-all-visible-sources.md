---
id: TASK-165
title: Treat an empty source list in the MCP query tool as all visible sources
status: Done
assignee:
  - '@claude'
created_date: '2026-10-30 16:13'
updated_date: '2026-10-30 16:19'
labels:
  - agent-api
milestone: m-0
dependencies: []
priority: high
type: bug
ordinal: 227000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The MCP `query` tool (`app/src/lib/server/agent/mcp.ts`) accepts `sources` as `z.array(z.string()).optional()` and passes `[]` on unchanged. `searchSnippets` (`app/src/lib/server/search/query.ts`) treats `[]` as a selection and binds `json_each('[]')`, which matches nothing. The agent gets `No results for "…"` for every question, and `agentQuery` records each one as a missed query with an empty source list. The HTTP route and the start page form already map a missing list to `undefined`. Model-driven clients often fill an optional array parameter with `[]`, so the agent silently finds nothing and the admin reads the missed-queries list as missing documentation. Found by reading the code, not reproduced; no test sends an empty list.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 A query with `sources: []` over MCP returns the same results as a query without `sources`
- [x] #2 Such a query is not recorded as a missed query when it finds results
- [x] #3 The rule "missing or empty list means every visible source" is decided in one place that MCP, HTTP and the start page all use
- [x] #4 A test sends `sources: []` over MCP
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. `querySources` treats an empty `sources` list like none, beside the question cut from TASK-164
2. Drop the own mapping in `queryOptions` (HTTP) and `answerQueryForm`
3. MCP test with `sources: []`
<!-- SECTION:PLAN:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
An empty `sources` list now means every visible source, decided once in `normalizeQueryOptions` inside `querySources` (`app/src/lib/server/agent/operations.ts`); MCP, HTTP and the start page form all pass their list on unchanged. A question that finds results with `sources: []` is no longer recorded as missed. Verified: new MCP test fails without the change (and so do HTTP tests, which now rely on the shared rule), all route and agent tests green.
<!-- SECTION:FINAL_SUMMARY:END -->
