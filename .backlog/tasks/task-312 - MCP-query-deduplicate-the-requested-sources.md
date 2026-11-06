---
id: TASK-312
title: 'MCP query: deduplicate the requested sources'
status: To Do
assignee: []
created_date: '2026-11-06 20:51'
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
- [ ] #1 A query naming the same source many times checks it once and answers like a query naming it once
- [ ] #2 An empty `sources` list behaves as today
- [ ] #3 A spec in `operations.spec.ts` covers duplicates
<!-- AC:END -->
