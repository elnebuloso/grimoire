---
id: TASK-26
title: Forward-only schema migrations
status: To Do
assignee: []
created_date: '2026-10-28T20:29:00Z'
labels: []
milestone: m-0
dependencies:
  - TASK-2
documentation:
  - docs/konzept.md
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
- [ ] #1 Schema changes are numbered SQL files applied in order; the current schema becomes the first one
- [ ] #2 The last applied number is recorded in the database, and only newer migrations run on start
- [ ] #3 Each migration runs in its own transaction; a failing one is rolled back, leaves the previous version intact and stops the start with an error naming the migration
- [ ] #4 Two processes migrating the same file at the same time apply each migration exactly once
- [ ] #5 Migrations can be run without starting the HTTP server, so an init container can run them
- [ ] #6 There are no down migrations; the handbook names restoring a backup as the way back
- [ ] #7 Tests cover a new database, an upgrade from an older version, a failing migration and two concurrent runs
<!-- AC:END -->
