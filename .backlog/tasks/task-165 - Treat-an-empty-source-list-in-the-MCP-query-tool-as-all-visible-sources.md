---
id: TASK-165
title: Treat an empty source list in the MCP query tool as all visible sources
status: To Do
assignee: []
created_date: '2026-10-30 16:13'
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
- [ ] #1 A query with `sources: []` over MCP returns the same results as a query without `sources`
- [ ] #2 Such a query is not recorded as a missed query when it finds results
- [ ] #3 The rule "missing or empty list means every visible source" is decided in one place that MCP, HTTP and the start page all use
- [ ] #4 A test sends `sources: []` over MCP
<!-- AC:END -->
