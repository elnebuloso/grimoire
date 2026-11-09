---
id: TASK-418
title: >-
  Sync: clean up stale pages left when indexing ends after the new index went
  live
status: Done
assignee:
  - '@claude'
created_date: '2026-11-09 10:17'
updated_date: '2026-11-09 10:59'
labels:
  - sync
dependencies: []
priority: low
type: bug
ordinal: 480000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
### What this is
The indexing child process (`app/src/lib/server/sync/index-worker.ts`) writes the new index with `replaceSourceIndex` (`app/src/lib/server/db/sources.ts`), which switches the source to the new generation and then deletes the old one (`deleteStalePages`), and only then sends its outcome to the server. The server (`app/src/lib/server/sync/sync.ts`) clears the indexing deadline only when the child closes.

### Problem
If the deadline fires, or memory runs out, while the old generation is being deleted, the new index is already live, but the sync records a `deadline` or `aborted` error with `failed_commit` set to the commit that is live. The leftover pages, snippets and FTS rows of the old generation stay until the branch moves again; search ignores them, they only take space. The error is wrong but short-lived: the failure leaves `last_commit` at the live commit, so the next check finds the branch unchanged and calls `clearSyncError` (`sync.ts`, the `latest === source.lastCommit` branch).

### Fix
Recommended: on the unchanged path (`latest === source.lastCommit`, next to `clearSyncError`), also delete the source's stale pages. `deleteStalePages(db, sourceId, snippetsPerBatch)` in `app/src/lib/server/db/sources.ts` is private today; export it (or a small wrapper using `SNIPPETS_PER_BATCH`). Deleting rows whose `generation` differs from the source's `index_generation` never touches live data. Careful: a sync that is writing right now also has rows with a non-live generation (its new index before go-live). Before deleting on the unchanged path, confirm in `app/src/lib/server/sync/queue.ts` that no sync of the same source can be writing at that moment; if it can, do the cleanup inside the sync lane instead, or choose the alternative: send the outcome before `deleteStalePages` runs.

Test without killing a process: in `app/src/lib/server/sync/sync.spec.ts`, after a successful sync, insert a page (with a snippet and FTS row, or let a second sync under a stand-in leave them) whose `generation` is not the live one, run a sync whose remote commit is unchanged, and expect the stale rows gone and the live index untouched. `sync.spec.ts` is the slowest spec; run just this case with `make test TEST="app/src/lib/server/sync/sync.spec.ts -t '<one word>'"` (two words break on the space).

### If we skip it
A rare false sync error that disappears on the next check, and stale rows on disk until the branch moves.

### Notes for the implementer
- Commit type: `fix` (released behaviour changes), so pushing it cuts a release; afterwards write the release-notes summary per `.claude/rules/release-notes.md`.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Leftover rows of an old generation are removed by the next sync, also when the branch is unchanged
- [x] #2 sync.spec.ts covers the leftover case
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Confirm in queue.ts that runs of one source never overlap (they are chained per source; the only caller of syncSource is the queue in sync/index.ts)
2. deleteStaleIndex in db/sources.ts: deletes non-live generations in batches with a turn between them
3. Call it on the unchanged path of syncSource next to clearSyncError
4. sync.spec.ts: leftover rows of an old generation go with the next unchanged check
<!-- SECTION:PLAN:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
A check that finds the branch unchanged now also deletes what earlier generations of the source's index left behind (deleteStaleIndex, batched like deleteSource so requests are answered in between). Safe because the queue chains the runs of a source: no run of the same source can be writing a not-yet-live generation at that moment, and syncSource has no caller outside the queue. The false error was already cleared on that path by clearSyncError. Test in sync.spec.ts inserts an old-generation page, snippet and FTS entry and expects them gone after an unchanged check with the live index untouched; confirmed to fail without the cleanup.
<!-- SECTION:FINAL_SUMMARY:END -->
