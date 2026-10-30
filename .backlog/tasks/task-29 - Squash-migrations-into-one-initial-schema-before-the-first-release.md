---
id: TASK-29
title: Squash migrations into one initial schema before the first release
status: Done
assignee:
  - '@claude'
created_date: '2026-10-28T21:22:00Z'
updated_date: '2026-10-30 14:43'
labels: []
milestone: m-0
dependencies:
  - TASK-9
  - TASK-10
  - TASK-11
  - TASK-12
  - TASK-13
  - TASK-14
  - TASK-15
  - TASK-16
  - TASK-17
  - TASK-18
documentation:
  - docs/decisions/0001-sqlite-single-instance-with-forward-migrations.md
priority: medium
type: chore
ordinal: 29000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Until version 1 is released, grimoire runs nowhere in production, so no database depends on the migration history. While version 1 is built, the schema changes often and each change adds a file to `app/src/lib/server/db/migrations/`. Decided with the user: the history may grow freely until the release, and as the last step of the milestone all migrations are merged into one `0001`. The squashed schema shows how mature the database is before it ships, and installations start from one clean file. From the first release on, migrations are forward-only and never edited (ADR 0001).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 All migrations are merged into a single `0001-initial.sql` that creates the same schema as applying them in order
- [x] #2 Tests that only covered an intermediate migration (e.g. the upgrade test for `0002`) are removed or rewritten against the final schema
- [x] #3 The handbook and `.env.example` mention no intermediate schema version; developers are told to delete their local `app/data/` database, which the squashed code refuses as newer than it knows
- [x] #4 Before the old files are deleted, the schema created by the squashed file is compared with the one created by the previous migrations (tables, columns, indexes, triggers) and found identical; the comparison is recorded in the task
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Record the schema the 20 migrations build (tables, column types/defaults/not null/pk, foreign keys, indexes, CHECKs, STRICT, view, trigger, `settings` row) as reference.
2. Write a clean `0001-initial.sql` holding the final schema with the comments that still hold; delete `0002`-`0020`.
3. Compare the new schema with the reference until identical.
4. Remove the tests of intermediate data migrations from `migrate.spec.ts`.
5. Following the new rule in `.claude/rules/until-v1.md` (schema changes in place until 1.0): `scripts/agent-seed.ts` drops and rebuilds the schema on every reset, in one transaction; README tells developers to delete `app/data/` after a schema change; `.claude/rules/agent-environment.md` says reset also rebuilds the schema.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Comparison: a script applied the 20 old migrations and the new `0001-initial.sql` each to an in-memory database and described the schema column-order independently (per table every column with type, NOT NULL, default, pk and hidden flag; foreign keys with ON DELETE; indexes with origin, uniqueness and columns; STRICT; CHECK clauses; normalized SQL of view and trigger; contents of `settings`). The two descriptions (187 lines) were identical (`diff` empty). Column order within tables changed (grouped logically); the code addresses columns by name, and lint, unit tests (625), e2e (18) and `make image-smoke` pass.
Removed tests: the five upgrade tests for `0002`, `0010`, `0011`, `0012`, `0013` and `0019` in `migrate.spec.ts`; the generic `migrate` tests stay.
Handbook: `database.md` already states that `0.x` releases have no update path and names no schema version; `.env.example` mentions none. Developers are told in `README.md` (Development) to delete `app/data/`.
Agent environment: `make agent-reset` rebuilt the database from version 20 to 1, also while the server ran; the fixture sources synced afterwards and search answered.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
The 20 migrations are squashed into one `app/src/lib/server/db/migrations/0001-initial.sql` holding the final schema, verified identical to the old chain by a structural comparison (columns, constraints, foreign keys, indexes, view, trigger, settings row). Upgrade tests of intermediate migrations are gone. Following the new pre-1.0 rule, the schema now changes in place: `make agent-reset` drops and rebuilds the schema in one transaction, and `README.md` tells developers to delete `app/data/` after a schema change. Existing databases (schema version 20) are refused and must be recreated. Lint, unit tests, e2e and image smoke test pass.
<!-- SECTION:FINAL_SUMMARY:END -->
