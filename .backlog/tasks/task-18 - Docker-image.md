---
id: TASK-18
title: Docker image
status: To Do
assignee: []
created_date: '2026-10-28T19:32:00Z'
updated_date: '2026-10-28T20:42:00Z'
labels:
  - ops
milestone: m-0
dependencies:
  - TASK-12
  - TASK-13
  - TASK-16
documentation:
  - docs/konzept.md
priority: high
type: feature
ordinal: 18000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
grimoire is operated as a single Docker image: Node plus git for syncing, one volume for the SQLite file, configuration via environment variables.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 One image contains the app and `git`
- [ ] #2 The SQLite file lives on a volume and survives container restarts
- [ ] #3 Admin credentials, polling interval and database path are set via environment variables
- [ ] #4 A `make` target builds the image
- [ ] #5 Verified: container starts, a source syncs, `query` answers via HTTP and MCP
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Handoff from TASK-26: the image needs no migrations folder (SQL is bundled). For Kubernetes, the same image runs as init container with `MIGRATE_ONLY=true` and the same `DATABASE_PATH`; see `docs/handbook/database.md` (one instance, `Recreate`, RWO/RWOP volume).

Handoff from TASK-25: the container needs `TOKEN_ENCRYPTION_KEY` (also the init container with `MIGRATE_ONLY`); the image must not contain a default key.
<!-- SECTION:NOTES:END -->
