---
id: TASK-310
title: 'Handbook: restore a backup without replaying a leftover WAL file'
status: Done
assignee:
  - '@claude'
created_date: '2026-11-06 20:51'
updated_date: '2026-11-06 21:11'
labels:
  - ops
dependencies: []
references:
  - docs/handbook/database.md
  - scripts/backup.ts
  - app/src/lib/server/db/index.ts
priority: medium
type: docs
ordinal: 372000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The handbook page `docs/handbook/database.md` presents the backup (`scripts/backup.ts`, `VACUUM INTO`) as the way back after a failed upgrade ("going back to the older version means restoring it", around line 58) and says how to copy the database file (around line 96). It does not say what to do with `grimoire.db-wal` and `grimoire.db-shm`.

Case (reproduced with throwaway databases): when the container is killed instead of stopped cleanly (OOM, `docker kill`, the stop grace period running out), `grimoire.db-wal` stays behind with the newest commits; the connection in `app/src/lib/server/db/index.ts` is never closed explicitly. Copying a backup over `grimoire.db` while that WAL is still next to it makes SQLite replay the WAL on the next open: the "restored" database contains rows and tables written after the backup, possibly the new version's schema and `user_version`, and `PRAGMA integrity_check` still says ok. Copying only `grimoire.db` of a killed instance gives an incomplete database. An idle production build stopped with SIGTERM does exit cleanly and removes the WAL (checked).

Suggested fix: a restore section in the handbook (stop grimoire, delete `grimoire.db-wal` and `grimoire.db-shm`, copy the backup to `grimoire.db`, start) and a corrected copy instruction (copy all three files, only while stopped). Optionally close the database on shutdown (`process.on('sveltekit:shutdown', …)` with adapter-node) so a clean stop always checkpoints.

Found by a whole-repo audit on 2026-11-06 (commit 601c588 plus six local refactor commits).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 `docs/handbook/database.md` has a restore section that removes `-wal` and `-shm` before copying the backup in
- [x] #2 The instruction for copying the database file names all three files and requires grimoire to be stopped
- [x] #3 `make handbook` passes
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. database.md: the copy paragraph names all three files and requires a stop
2. New section "Restoring a backup": stop, delete -wal and -shm, copy the backup in as uid 1000, start the version the backup was taken with; one line for Kubernetes
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
- The restore command was tried on a throwaway Docker volume with node:24.22.1-trixie-slim as uid 1000 (the base and user of the image): -wal and -shm are removed, the backup lands as grimoire.db owned by 1000.
- make handbook passes.
- Not done: closing the database on shutdown, which the task named as optional; the restore steps cover the killed-container case.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
The handbook page database.md now has a "Restoring a backup" section: stop grimoire, delete grimoire.db-wal and grimoire.db-shm, copy the backup in through a container running as uid 1000, start the version the backup was taken with. It says why: a WAL left by a killed container would otherwise be replayed into the restored file without an error. The plain-copy advice now names all three files. The command was tried on a throwaway volume; make handbook passes.
<!-- SECTION:FINAL_SUMMARY:END -->
