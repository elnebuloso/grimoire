---
id: TASK-418
title: >-
  Sync: clean up stale pages left when indexing ends after the new index went
  live
status: To Do
assignee: []
created_date: '2026-11-09 10:17'
updated_date: '2026-11-09 10:20'
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
- [ ] #1 Leftover rows of an old generation are removed by the next sync, also when the branch is unchanged
- [ ] #2 sync.spec.ts covers the leftover case
<!-- AC:END -->
