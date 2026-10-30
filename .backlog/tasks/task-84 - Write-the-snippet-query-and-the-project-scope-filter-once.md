---
id: TASK-84
title: Write the snippet query and the project scope filter once
status: Done
assignee:
  - '@claude'
created_date: '2026-10-30 01:34'
updated_date: '2026-10-30 01:49'
labels:
  - agent-api
  - search
milestone: m-0
dependencies:
  - TASK-81
references:
  - app/src/lib/server/agent/operations.ts
  - app/src/lib/server/search/query.ts
priority: low
type: chore
ordinal: 146000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Found by a code review on 2026-10-30.

`readById` in `app/src/lib/server/agent/operations.ts` and `searchSnippets` in `app/src/lib/server/search/query.ts` select the same nine columns over the same four joins to fill a `SnippetRow`, and both cast the result with `as unknown as SnippetRow[]`. The project scope is written twice too: `IN_SCOPE` with `:scope` in `operations.ts`, and its own `:allowed` clause in `query.ts`.

The next field a rendered snippet needs (page title, tags, last-synced date) must be added to both queries, and the casts hide the one that was missed until an agent gets `undefined` in its Markdown. A change to how scope matches (e.g. by project ID instead of slug) again has two places to change in step. Commit `f7e7a66` (`toSnippetHit`) started removing this duplication but stopped short.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 One function in `search/query.ts` owns the `SnippetRow` columns and joins; `readById` and `searchSnippets` supply only their own WHERE/ORDER BY parts
- [x] #2 Both use the same project scope clause
- [x] #3 No behaviour change: existing search, read and scoping tests pass unchanged
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. `selectSnippets` in search/query.ts owns the SnippetRow columns, the joins, the scope clause and the mapping to hits; callers pass an extra join, WHERE, ORDER BY, LIMIT and their parameters.
2. `IN_SCOPE` and `scopeParameter` move to query.ts and are shared with the project queries in operations.ts.
3. `searchSnippets` and `readById` use it; `toSnippetHit` and `SnippetRow` become private.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
The FTS search now starts from `snippets` and joins `snippets_fts`; MATCH and bm25 work the same (search tests unchanged and green). No test file changed; 436 server tests and make lint pass. Agent environment: query and section read answer as before.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
The snippet query lives once, in `selectSnippets` (search/query.ts): columns, joins, project scope and mapping to `SnippetHit`. `searchSnippets` and `readById` only add their own WHERE/ORDER BY/LIMIT, and the scope clause `IN_SCOPE` is shared by every scoped query. The next field a snippet needs gets added in one place. No behaviour change: unchanged tests pass, make lint passes, agent environment checked.
<!-- SECTION:FINAL_SUMMARY:END -->
