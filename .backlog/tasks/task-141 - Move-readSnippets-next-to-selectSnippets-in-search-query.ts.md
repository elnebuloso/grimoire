---
id: TASK-141
title: Move readSnippets next to selectSnippets in search/query.ts
status: To Do
assignee: []
created_date: '2026-10-30 10:55'
labels:
  - search
milestone: m-0
dependencies: []
priority: low
type: chore
ordinal: 203000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Found in the second whole-project code review of 2026-10-30. `app/src/lib/server/admin/status.ts` (line 2) imports `readSnippets` from `app/src/lib/server/agent/operations.ts`, so the management area depends on the agent transport layer for a plain read helper. `readSnippets` is a `selectSnippets` call and belongs next to it in `app/src/lib/server/search/query.ts`, which both `agent/` and `admin/` already import from.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 `readSnippets` lives in `app/src/lib/server/search/query.ts`; `admin/` no longer imports from `agent/`
- [ ] #2 Behaviour is unchanged; existing tests pass
<!-- AC:END -->
