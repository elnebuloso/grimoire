---
id: TASK-81
title: 'Make "all projects" an explicit, required project scope'
status: To Do
assignee: []
created_date: '2026-10-30 01:34'
labels:
  - agent-api
  - search
milestone: m-0
dependencies: []
references:
  - app/src/lib/server/agent/operations.ts
  - app/src/lib/server/search/query.ts
  - app/src/lib/server/admin/status.ts
  - app/src/lib/server/api-keys.ts
priority: medium
type: enhancement
ordinal: 143000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Found by a code review on 2026-10-30.

"This key may see every project" has two spellings. `ApiKey.projects` in `app/src/lib/server/api-keys.ts` uses `'all' | string[]`. The scope that actually guards reads uses `undefined`: `ProjectScope = string[] | undefined` in `app/src/lib/server/agent/operations.ts`, and `allowedProjects?: string[]` in `SearchOptions` in `app/src/lib/server/search/query.ts`.

Because `allowedProjects` is optional, `searchSnippets(db, { query })` type-checks and searches every project. The next caller that forgets the field or passes a not-yet-loaded value (a search box in the management UI, a second kind of key, per-user scopes once ADR 0003 roles arrive) silently widens access, and neither the compiler nor a test catches it. At the one place that means "all" on purpose, `readById(…, undefined)` in `app/src/lib/server/admin/status.ts` (`previewPage`), the literal reads like "no scope".

Also, `ProjectScope` lives in the agent layer and is imported by `api-keys.ts`, so the lower-level module depends on the agent layer for its own return type.

An empty array must keep meaning "nothing" (a key whose selected projects are all gone sees nothing). The SQL may keep its `IS NULL` branch; only the translation into the SQL parameter needs to know about `null`.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 One scope type `'all' | string[]` is used everywhere a read is scoped; `undefined` no longer means all projects
- [ ] #2 The scope is a required field/parameter of `SearchOptions` and of the agent operations, so leaving it out is a type error
- [ ] #3 The type is defined in or below `api-keys.ts`, not in `agent/operations.ts`
- [ ] #4 An empty selection still sees nothing, and `previewPage` passes `'all'` explicitly
- [ ] #5 Existing scoping tests pass; `make check` (or the project type check) passes
<!-- AC:END -->
