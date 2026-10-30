---
id: TASK-105
title: One error contract for the admin modules
status: To Do
assignee:
  - '@claude'
created_date: '2026-10-30 02:59'
labels:
  - admin
milestone: m-0
dependencies:
  - TASK-100
  - TASK-104
references:
  - app/src/lib/server/admin/projects.ts
  - app/src/lib/server/admin/source-access.ts
  - app/src/lib/server/api-keys.ts
priority: low
type: chore
ordinal: 167000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Found by a code review of the management area on 2026-10-30.

The modules under `app/src/lib/server/admin/` and their neighbours report failures in four different ways:
- `auth.ts` returns `AuthProblem` codes. That is required: `scripts/` load it with plain Node, where the messages are not available (`.claude/rules/ui-components.md`).
- `projects.ts` returns translated strings, or `{ error: string }` from the `save*` functions (`SaveResult`).
- `source-access.ts` returns `{ ok, message }`.
- `api-keys.ts` throws (the API key actions are handled by their own task).

`changeProjectSlug` and `changeSourceSlug` (`projects.ts`, around lines 149 and 380) return `undefined` both on success and for "no such project/source"; name and doc comment say `undefined` means "changed". The routes check for the missing case first, so it is harmless today, but a caller reading the signature would report success for a wrong ID.

Each route has to know which convention its module uses, later code has no default to follow, and tests that compare texts couple the specs to `en.json`. Goal: expected refusals are returned in the `SaveResult` shape `{ error }`, exceptions mean "broken".
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 `projects.ts`, `source-access.ts` and `api-keys.ts` return expected refusals in one shape; unexpected failures throw
- [ ] #2 `changeProjectSlug` and `changeSourceSlug` tell "not found" apart from "changed", with a test each
- [ ] #3 `auth.ts` keeps returning codes, since plain Node loads it
- [ ] #4 All admin route tests pass
<!-- AC:END -->
