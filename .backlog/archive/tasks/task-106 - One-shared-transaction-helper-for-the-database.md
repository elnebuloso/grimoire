---
id: TASK-106
title: One shared transaction helper for the database
status: Done
assignee:
  - '@claude'
created_date: '2026-10-30 02:59'
updated_date: '2026-10-30 03:34'
labels:
  - admin
milestone: m-0
dependencies:
  - TASK-105
references:
  - app/src/lib/server/admin/auth.ts
  - app/src/lib/server/admin/projects.ts
  - app/src/lib/server/api-keys.ts
  - app/src/lib/server/db/sources.ts
priority: low
type: chore
ordinal: 168000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Found by a code review of the management area on 2026-10-30.

The same `BEGIN IMMEDIATE` / `COMMIT` / `if (db.isTransaction) ROLLBACK` wrapper is written six times: `app/src/lib/server/admin/auth.ts` (three times, around lines 91, 211 and 278), `app/src/lib/server/admin/projects.ts` (around 396), `app/src/lib/server/api-keys.ts` (`inTransaction`, around 103) and `app/src/lib/server/db/sources.ts` (`inTransaction`, around 234). All copies are correct today, but two named helpers already exist side by side and the next write path will copy one of the six at random.

`auth.ts` is loaded by plain Node from `scripts/`, so the shared helper must be importable from there (relative import with a `.ts` extension, no `#lib` alias or SvelteKit module).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 One exported transaction helper in `app/src/lib/server/db/` replaces all six copies
- [x] #2 The helper rolls back on error and rethrows, with a test
- [x] #3 `scripts/` that load `auth.ts` with plain Node still run
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. `app/src/lib/server/db/transaction.ts` exports `inTransaction(db, work)`, imports only `node:sqlite` types, so plain Node can load it.
2. Replace the copies in `auth.ts` (3), `projects.ts`, `api-keys.ts`, `db/sources.ts`, and the one in `db/migrate.ts`.
3. `createProjectWithSource` checks project and source before writing, so a refusal needs no rollback.
4. Test commit and rollback of the helper.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
`db/migrate.ts` had a seventh copy and uses the helper too. `scripts/agent-seed.ts` keeps its own top-level BEGIN/COMMIT: a script, not a write path of the server. `createProjectWithSource` now validates both forms inside the transaction before writing; the saves cannot refuse after that, and `savedId` throws if they still do. Checked: make lint, make test (558), make e2e (17), `node scripts/reset-admin.ts` loads `auth.ts` under plain Node, `make agent-reset` runs the seed with the migrations.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
One `inTransaction` in `app/src/lib/server/db/transaction.ts` replaces the six copies the review found plus one more in `migrate.ts`. It is plain-Node loadable, so `auth.ts` and the scripts keep working. `createProjectWithSource` validates before writing, so a refusal needs no rollback. A new spec covers commit and rollback; lint, the full suite, e2e and both scripts were run.
<!-- SECTION:FINAL_SUMMARY:END -->
