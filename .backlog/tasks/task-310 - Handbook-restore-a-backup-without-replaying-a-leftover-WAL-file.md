---
id: TASK-310
title: 'Handbook: restore a backup without replaying a leftover WAL file'
status: To Do
assignee: []
created_date: '2026-11-06 20:51'
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
- [ ] #1 `docs/handbook/database.md` has a restore section that removes `-wal` and `-shm` before copying the backup in
- [ ] #2 The instruction for copying the database file names all three files and requires grimoire to be stopped
- [ ] #3 `make handbook` passes
<!-- AC:END -->
