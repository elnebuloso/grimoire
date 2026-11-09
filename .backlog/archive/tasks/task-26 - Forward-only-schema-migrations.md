---
id: TASK-26
title: Forward-only schema migrations
status: Done
assignee:
  - '@claude'
created_date: '2026-10-28T20:29:00Z'
updated_date: '2026-10-29T00:34:00Z'
labels: []
milestone: m-0
dependencies:
  - TASK-2
documentation:
  - docs/concept.md
priority: high
type: feature
ordinal: 26000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The schema is only created when the database is new (`PRAGMA user_version` 0 in `app/src/lib/server/db/schema.ts`); a later schema change, starting with encrypted tokens, has no way to reach an existing database. grimoire will run in Kubernetes as a single pod with its SQLite file on a block volume, and an init container in that pod is meant to migrate before the app starts, so migrating must work without the HTTP server and must not run twice when the init container and the app start overlap. Projects, sources and API keys are real data a migration must keep; pages, snippets, links and the search index are rebuilt by the next sync and may be dropped by a migration.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Schema changes are numbered SQL files applied in order; the current schema becomes the first one
- [x] #2 The last applied number is recorded in the database, and only newer migrations run on start
- [x] #3 Each migration runs in its own transaction; a failing one is rolled back, leaves the previous version intact and stops the start with an error naming the migration
- [x] #4 Two processes migrating the same file at the same time apply each migration exactly once
- [x] #5 Migrations can be run without starting the HTTP server, so an init container can run them
- [x] #6 There are no down migrations; the handbook names restoring a backup as the way back
- [x] #7 Tests cover a new database, an upgrade from an older version, a failing migration and two concurrent runs
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Move the schema into `app/src/lib/server/db/migrations/0001-initial.sql`; files are bundled with Vite `import.meta.glob` (`?raw`), so the image needs no migrations folder.
2. `migrate(db, migrations)` in `db/migrate.ts`: foreign keys off before each transaction, `BEGIN IMMEDIATE`, read `user_version` inside the transaction, apply, `PRAGMA foreign_key_check`, set `user_version`, commit; on error roll back and throw naming the file. Foreign keys back on afterwards.
3. `openDatabase` sets a busy timeout, switches to WAL only when not already in WAL and retries that switch while the file is locked, then migrates.
4. `MIGRATE_ONLY=true` makes the server exit after the `init` hook has migrated, before it listens – the init container runs the same image with it.
5. Tests: new database, upgrade from an older version, failing migration, a migration that would cascade-delete, two concurrent processes on a new file (child processes).
6. Handbook note on no down migrations: `docs/handbook/` does not exist yet (TASK-19); record it there as a note for TASK-19.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Measured with two Node processes migrating one file at the same time (`BEGIN IMMEDIATE`, `user_version` read inside the transaction, `timeout: 5000` on `DatabaseSync`): every migration was applied exactly once in 40 of 40 runs. On a new file, 3 of 40 runs failed with "database is locked" despite the timeout – always at `PRAGMA journal_mode = WAL`, which `openDatabase` runs on every open; on a file already in WAL mode no run failed (3 runs). The switch to WAL needs its own handling (e.g. retry, or skip when `PRAGMA journal_mode` already reports `wal`) and the concurrency test must start from a new file.

From the SQLite docs, not measured: `PRAGMA foreign_keys` has no effect inside a transaction. With foreign keys on, dropping a table during a table rebuild deletes the rows of child tables with `ON DELETE CASCADE` (e.g. rebuilding `projects` would empty `sources`). The runner should switch foreign keys off before `BEGIN` and run `PRAGMA foreign_key_check` before `COMMIT`.

The concurrency test was checked against the bug it guards: with the WAL retry removed it failed in 3 of 4 runs at 10 rounds; it now runs 20 rounds (about one round in eight collides).
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Schema changes are now numbered SQL files in `app/src/lib/server/db/migrations/` (the existing schema is `0001-initial.sql`), bundled via `import.meta.glob`. `migrate(db, migrations)` in `db/migrate.ts` applies the ones newer than `PRAGMA user_version`, each under `BEGIN IMMEDIATE` with the version re-read inside the transaction, foreign keys off and `PRAGMA foreign_key_check` before commit; a failure rolls back and throws naming the file. It also refuses migrations out of sequence and a database newer than the code. `openMigratedDatabase` sets a 5 s busy timeout and retries the switch to WAL, which measurably fails without waiting on a new file. `MIGRATE_ONLY=true` (declared in `app/src/env.ts`) makes the server exit after migrating in the `init` hook, before it listens. New handbook page `docs/handbook/database.md` covers configuration, one instance, schema updates, the init container and backups. Verified: 9 tests in `db/migrate.spec.ts` incl. two real processes on 20 new files (70 tests in total), `make lint`, `make build`; the built server with `MIGRATE_ONLY=true` exits 0 after 147 ms with schema version 1 in WAL mode, and starts serving without it.
<!-- SECTION:FINAL_SUMMARY:END -->
