---
id: TASK-381
title: >-
  Sync: a late sync of a deleted source must not write into a new source that
  reuses its id
status: Done
assignee:
  - '@claude'
created_date: '2026-11-08 16:44'
updated_date: '2026-11-08 16:59'
labels:
  - sync
dependencies: []
priority: high
type: bug
ordinal: 443000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
`sources.id` is `INTEGER PRIMARY KEY` without `AUTOINCREMENT` (`app/src/lib/server/db/migrations/0001-initial.sql:7`), so SQLite hands the highest deleted id to the next inserted source. `checkAndSync` in `app/src/lib/server/sync/sync.ts:95-160` reads URL, branch, path and the decrypted token of the source once, at its start, then waits in the single sync lane (minutes when other syncs run). At the end `replaceSourceIndex` in `app/src/lib/server/db/sources.ts:221-233` switches the generation with `UPDATE sources … WHERE id = ?` only; `recordCheck`, `recordSyncError` and `recordSyncRun` also write by id. Deleting a source (`app/src/routes/manage/sources/[id]/[[tab=tab]]/+page.server.ts:226`) neither waits for nor cancels a queued sync.

Case: an admin clicks "Sync now" on the newest source (id 7); while the job waits, the admin deletes source 7 and creates a new source, which gets id 7 again. The old job clones the old repository with the old token and writes its pages under the new source's slug and visibility. If the new source is public and the old one was internal, internal documentation is readable without a key. `indexSettingsChanged` (sync.ts:160) only clears `last_commit`, so the wrong content stays live until the new source's own sync; a source created paused never forces one. `sync.spec.ts:360` covers deleting a source during a sync, but not a new source taking its id.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 A sync whose source was deleted and replaced by a new source with the same id while it waited writes nothing into the new source: not its pages, snippets, links, generation, last commit, sync history or error
- [x] #2 The check compares what the job started from (Git URL, branch, path) with the row it writes to, at the generation switch, and the job ends as failed or skipped instead of indexing
- [x] #3 A spec in sync.spec.ts reproduces the case (delete, insert a source that gets the same id, let the queued sync finish) and fails before the fix
- [x] #4 Whether new source ids should also stop being reused (a migration rebuilding sources with AUTOINCREMENT, as migration 0007 rebuilds a table) is decided with the user and recorded in the task notes
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Migration 0010 rebuilds sources with AUTOINCREMENT (dropping and recreating the live_pages view around the rename).
2. replaceSourceIndex takes startedFrom (Git URL, branch, path, exclusions) and switches the generation only while the row still has them; otherwise it deletes the pages it wrote and returns false.
3. The indexing process passes the settings of the job and fails the sync when the switch did not happen.
4. Specs in sync.spec.ts for a new source created while the deleted one's sync waited, and for settings changed while the sync waited; handbook row for the new error.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Decision (user, 2026-11-08): do both. A migration rebuilds sources with AUTOINCREMENT so ids are never reused (removes the cause; old /manage/sources/<id> links and mails no longer reach another source), and the job still compares Git URL, branch and path with the row at the generation switch (also catches settings changed while the job waited).

Exclusions are compared too: a changed exclusion must not let the old run publish pages that are now excluded. Both new specs fail without the fix (verified by stashing it) and pass with it. Full make test: only schema.spec (sqlite_sequence now exists) and index-worker.spec (job needs branch) failed, both fixed and rerun.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Source ids are no longer reused: migration 0010 rebuilds sources with AUTOINCREMENT, so a queued sync of a deleted source can only write to an id nobody has. At the generation switch the indexing process now also requires the source to still have the Git URL, branch, path and exclusions the job started from; otherwise its pages are deleted again and the sync fails with 'the source was changed or deleted while this sync waited; …', keeping the previous index. Handbook lists the error. Tests: the new sync.spec cases (fail before, pass after), full make test green after fixing schema.spec and index-worker.spec.
<!-- SECTION:FINAL_SUMMARY:END -->
