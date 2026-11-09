---
id: TASK-105
title: One error contract for the admin modules
status: Done
assignee:
  - '@claude'
created_date: '2026-10-30 02:59'
updated_date: '2026-10-30 03:30'
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
- [x] #1 `projects.ts`, `source-access.ts` and `api-keys.ts` return expected refusals in one shape; unexpected failures throw
- [x] #2 `changeProjectSlug` and `changeSourceSlug` tell "not found" apart from "changed", with a test each
- [x] #3 `auth.ts` keeps returning codes, since plain Node loads it
- [x] #4 All admin route tests pass
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Shape for expected refusals: `{ error }` next to the success value; exceptions mean broken.
2. `checkSourceAccess` returns `{ message } | { error }` instead of `{ ok, message }`; routes and pages branch on `'error' in`.
3. `changeProjectSlug`/`changeSourceSlug` return `SaveResult | 'not-found'`; routes answer 'not-found' with 404.
4. `api-keys.ts` already returns `{ error: code }` (TASK-100); `auth.ts` keeps its codes.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
The `*Problem` validators in `projects.ts` (`projectProblem`, `sourceProblem`, `remoteProblem`) still return `string | undefined`: they are checks that answer 'what is wrong', not operations, and the routes combine them with `??`. Turning them into `{ error }` would add wrapping without a reader gaining anything. `api-keys.ts` refusals carry codes, the admin modules carry translated texts; the shape is the same, the content differs because `api-keys.ts` is also used by the agent API. Checked: make lint, make test (556), make e2e (17), and 'Test access' in the browser for a reachable and an unknown branch.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Expected refusals from the admin operations now come back as `{ error }` next to the success value: the access check returns `{ message } | { error }` instead of `{ ok, message }`, and the slug changers return `{ id } | { error } | 'not-found'`, so a missing project or source can no longer pass for a successful change. Routes answer 'not-found' with 404. `auth.ts` keeps returning codes for plain Node. The validators (`*Problem`) were left as `string | undefined` on purpose. Verified by unit and route tests (new not-found tests), lint, e2e and a browser check of 'Test access'.
<!-- SECTION:FINAL_SUMMARY:END -->
