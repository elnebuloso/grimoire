---
id: TASK-312
title: 'MCP query: deduplicate the requested sources'
status: Done
assignee:
  - '@claude'
created_date: '2026-11-06 20:51'
updated_date: '2026-11-06 21:01'
labels:
  - agent-api
dependencies: []
references:
  - app/src/lib/server/agent/mcp.ts
  - app/src/lib/server/agent/operations.ts
priority: medium
type: bug
ordinal: 374000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The MCP `query` tool accepts `sources` as an unbounded `z.array(z.string())` (`app/src/lib/server/agent/mcp.ts`). `normalizeQueryOptions` / the source check in `app/src/lib/server/agent/operations.ts` calls `findSource` for every entry, and each call prepares and runs its own statement.

Case: a 512 KB JSON body (adapter-node's default limit) holds about 75k copies of `"docs",` for a public slug. 120k `findSource` calls measured 5.2 s, so one such request blocks the event loop for about 3 s, without any key. Over HTTP (`/query?source=…`, repeatable) the header size caps it at about 60 ms.

Suggested fix: deduplicate in `normalizeQueryOptions` (`[...new Set(options.sources)]`, keeping today's handling of an empty list); optionally refuse a list longer than the number of sources.

Found by a whole-repo audit on 2026-11-06 (commit 601c588 plus six local refactor commits).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 A query naming the same source many times checks it once and answers like a query naming it once
- [x] #2 An empty `sources` list behaves as today
- [x] #3 A spec in `operations.spec.ts` covers duplicates
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Specs: a source named 1000 times answers as named once with few prepared statements; a missed query with a repeated source records it once
2. normalizeQueryOptions deduplicates sources with a Set; an empty list stays undefined
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
- Both specs failed before (1000 prepares, duplicate in the recorded sources) and pass after; operations.spec.ts and agent-api.spec.ts pass (80 tests).
- HTTP goes through the same normalization, so repeated ?source= is deduplicated too.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Query options now deduplicate the named sources before each one is checked, so an MCP request naming one source tens of thousands of times costs one check instead of seconds on the server thread. The answer is identical to naming it once, an empty list still means all sources, and a missed query records each source once. Covered by two specs in operations.spec.ts.
<!-- SECTION:FINAL_SUMMARY:END -->
