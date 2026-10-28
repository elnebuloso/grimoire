---
id: TASK-29
title: Squash migrations into one initial schema before the first release
status: To Do
assignee: []
created_date: '2026-10-28T21:22:00Z'
updated_date: '2026-10-28T21:22:00Z'
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
- [ ] #1 All migrations are merged into a single `0001-initial.sql` that creates the same schema as applying them in order
- [ ] #2 Tests that only covered an intermediate migration (e.g. the upgrade test for `0002`) are removed or rewritten against the final schema
- [ ] #3 The handbook and `.env.example` mention no intermediate schema version; developers are told to delete their local `app/data/` database, which the squashed code refuses as newer than it knows
- [ ] #4 Before the old files are deleted, the schema created by the squashed file is compared with the one created by the previous migrations (tables, columns, indexes, triggers) and found identical; the comparison is recorded in the task
<!-- AC:END -->
