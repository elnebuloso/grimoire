---
id: TASK-18
title: Docker image
status: To Do
assignee: []
created_date: '2026-10-28T19:32:00Z'
updated_date: '2026-10-28T22:59:00Z'
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
- [ ] #3 Polling interval, database path and token encryption key are set via environment variables
- [ ] #4 A `make` target builds the image
- [ ] #5 Verified: container starts, a source syncs, `query` answers via HTTP and MCP
- [ ] #6 The image contains `scripts/reset-admin.ts`, runnable with `node` in the container
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Handoff from TASK-26: the image needs no migrations folder (SQL is bundled). For Kubernetes, the same image runs as init container with `MIGRATE_ONLY=true` and the same `DATABASE_PATH`; see `docs/handbook/database.md` (one instance, `Recreate`, RWO/RWOP volume).

Handoff from TASK-25: the container needs `TOKEN_ENCRYPTION_KEY` (also the init container with `MIGRATE_ONLY`); the image must not contain a default key.

Database volume: mount a directory (e.g. `/data`), not the file – SQLite keeps `-wal` and `-shm` next to it; set `DATABASE_PATH=/data/grimoire.db`. A missing directory is created on start. See `docs/handbook/database.md`.

The image needs Node 24 (built-in `node:sqlite`; the test suite also loads TypeScript directly in child processes) and `git`. The Node version is not pinned anywhere in the repo yet (no `engines`, no `.nvmrc`).

The image needs Node 24.22.1 or newer: older versions carry the Brotli decoder flaw CVE-2026-111497 (fixed in 24.22.1 by a cherry-pick, so `process.versions.brotli` still says 1.2.0; check `zlib.constants.BROTLI_DECODER_ERROR_FORMAT_BLOCK_SWITCH` instead). Use a Node base image of at least that version, not the Debian `nodejs` package (bookworm and trixie are still vulnerable there).
<!-- SECTION:NOTES:END -->
