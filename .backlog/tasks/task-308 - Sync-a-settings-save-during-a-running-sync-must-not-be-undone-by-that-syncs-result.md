---
id: TASK-308
title: >-
  Sync: a settings save during a running sync must not be undone by that sync's
  result
status: Done
assignee:
  - '@claude'
created_date: '2026-11-06 20:51'
updated_date: '2026-11-06 21:16'
labels:
  - sync
dependencies: []
references:
  - app/src/lib/server/admin/sources.ts
  - app/src/lib/server/db/sources.ts
  - app/src/lib/server/sync/sync.ts
  - app/src/lib/server/sync/index-worker.ts
priority: medium
type: bug
ordinal: 370000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
`saveSource` (`app/src/lib/server/admin/sources.ts`, writing through `app/src/lib/server/db/sources.ts`) sets `last_commit` and `failed_commit` to NULL when a change affects the index, so the next sync re-indexes with the new settings (TASK-204, TASK-210). A sync that is already running started with the old path, branch and exclusions and writes `last_commit = <commit>` when it finishes (index worker, `app/src/lib/server/sync/index-worker.ts`), or `failed_commit` through `recordSyncError`.

Case:
1. An admin clicks "sync now" on a source, or a scheduled sync of it is running.
2. Meanwhile syncs are paused (globally or for the source), the admin adds `docs/internal/**` to the exclusions and saves. Because syncs are paused, no forced sync is queued.
3. The running sync finishes and writes `last_commit = c1`, built with the old exclusions.
4. After resuming, the next check sees `latest === lastCommit` and returns `unchanged`.

The excluded pages stay indexed and readable by agents until a new commit is pushed. The same race restores `failed_commit` and defeats the retry after a settings change. No spec covers a save during a running sync.

Suggested fix: pass the index-relevant settings (git URL, branch, path, exclusions) in the `IndexJob`, and write `last_commit` (and `failed_commit` in `recordSyncError`) only when the stored settings still match them, otherwise NULL.

Found by a whole-repo audit on 2026-11-06 (commit 601c588 plus six local refactor commits).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 When the index-relevant settings change while a sync of the source runs, that sync's completion leaves `last_commit` empty so the next sync re-indexes
- [x] #2 The same holds for `failed_commit` when the running sync fails
- [x] #3 A sync whose settings were not changed meanwhile records its commit as before
- [x] #4 A spec covers a save between the start and the end of a sync
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Specs: a save that changes the exclusions while the stand-in indexing runs leaves the next sync indexing again; the same for a failing sync
2. db/sources.ts: indexSettingsChanged compares git URL, branch, path and exclusions with what the sync started from; forgetIndexedCommit drops last_commit
3. sync.ts checks after the indexing result arrives on the main thread: drops the commit after success, records no failed commit after failure
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
- The check runs on the main thread after the worker committed: a save before it is caught by the comparison, a save after it drops the commits itself, so no window is left.
- Chosen over passing the settings into the IndexJob: the worker stays unchanged, and the main process already holds the settings the sync started from.
- Both specs failed before and pass after; sync-logic.spec.ts, sync.spec.ts and db/sources.spec.ts pass (35 tests). The existing "leave the index alone" spec shows an unchanged save still records the commit.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
A settings save while a sync of the source runs is no longer undone by that sync: when its result arrives, the main process compares the git URL, branch, path and exclusions with the ones the sync started from and, if they changed, drops the recorded commit (or records no failed commit), so the next sync indexes with the new settings. Two specs in sync-logic.spec.ts cover a succeeding and a failing sync.
<!-- SECTION:FINAL_SUMMARY:END -->
