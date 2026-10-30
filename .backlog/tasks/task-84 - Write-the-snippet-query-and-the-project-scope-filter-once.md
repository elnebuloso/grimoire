---
id: TASK-84
title: Write the snippet query and the project scope filter once
status: To Do
assignee: []
created_date: '2026-10-30 01:34'
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
- [ ] #1 One function in `search/query.ts` owns the `SnippetRow` columns and joins; `readById` and `searchSnippets` supply only their own WHERE/ORDER BY parts
- [ ] #2 Both use the same project scope clause
- [ ] #3 No behaviour change: existing search, read and scoping tests pass unchanged
<!-- AC:END -->
