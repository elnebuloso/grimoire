---
id: TASK-100
title: >-
  API key actions: report only an unknown project as "project deleted", let
  other errors through
status: Done
assignee:
  - '@claude'
created_date: '2026-10-30 02:59'
updated_date: '2026-10-30 03:09'
labels:
  - admin
milestone: m-0
dependencies: []
references:
  - app/src/routes/manage/api-keys/+page.server.ts
  - app/src/lib/server/api-keys.ts
priority: medium
type: bug
ordinal: 162000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Found by a code review of the management area on 2026-10-30 (read only, not reproduced).

The `create` and `update` actions in `app/src/routes/manage/api-keys/+page.server.ts` (around lines 55-66 and 73-83) wrap the call to `createApiKey` / `updateApiKey` (`app/src/lib/server/api-keys.ts`) in a bare `catch {}` and answer with the message `apikeys_error_project_gone`. Those functions do throw for an unknown project slug, but other things throw there too:

- A key that no longer exists (revoked in another tab, or `id` missing so `Number(null)` gives `0`): the `UPDATE` changes no row, then `insertScope` inserts into `api_key_projects` with a dangling `api_key_id`; with `PRAGMA foreign_keys = ON` (`app/src/lib/server/db/migrate.ts:24`) that is a constraint error. The admin is told a *project* is gone. Without a project selection the action reports `updated: 0`, which counts as success.
- `SQLITE_BUSY` after the busy timeout, while the index worker holds the write lock: same project message, and the real error never reaches `handleError` or the log.

So the admin gets a misleading message, a database problem leaves no trace, and the catch-all is the template the next copied action will follow. `app/src/lib/server/admin/projects.ts` already shows the intended pattern: expected refusals are returned as `{ error }`, everything else propagates.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 `createApiKey` and `updateApiKey` return a result for an unknown project instead of throwing; the actions no longer catch everything
- [x] #2 Any other error (e.g. a busy or closed database) propagates and is logged through `handleError`, not reported as a deleted project
- [x] #3 Updating a key that does not exist (revoked, or no valid `id`) gets its own answer (404 or a message of its own) and changes nothing
- [x] #4 Tests cover unknown project, missing key and an unexpected database error
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. `createApiKey`/`updateApiKey` resolve all project slugs first and return `{ error: 'unknown-project' }`; `updateApiKey` returns `{ error: 'unknown-key' }` when the UPDATE hits no row. Nothing else is caught.
2. Actions: unknown project -> the existing 400 message; unknown or malformed key id -> `error(404)` (a revoked key is no longer listed, so there is no form to put a message in).
3. Tests: unit specs for both refusals, route specs for 404 and for a closed database propagating.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Chose 404 over a message: `revokeApiKey` deletes the row, so the key and its form vanish from the list and a per-key message could not be shown. Thrown errors reach `handleError` in `hooks.server.ts`, which logs them. The two new route tests fail on the old code. Browser check: key revoked in a second tab, then 'change' in the first -> 404 page. make lint and make test pass.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
API key create/update no longer catch everything. The library returns `unknown-project` and `unknown-key` as results; the actions show the project message only for the first, answer 404 for a key that no longer exists or has no valid id, and let any other error propagate to `handleError`, which logs it. Verified by unit and route tests (the route ones fail on the old code), a browser check, lint and the full suite.
<!-- SECTION:FINAL_SUMMARY:END -->
