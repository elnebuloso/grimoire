---
id: TASK-106
title: One shared transaction helper for the database
status: To Do
assignee:
  - '@claude'
created_date: '2026-10-30 02:59'
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
- [ ] #1 One exported transaction helper in `app/src/lib/server/db/` replaces all six copies
- [ ] #2 The helper rolls back on error and rethrows, with a test
- [ ] #3 `scripts/` that load `auth.ts` with plain Node still run
<!-- AC:END -->
