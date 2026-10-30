---
id: TASK-132
title: >-
  Give the indexing worker a deadline so one stuck sync cannot block every
  source
status: Done
assignee:
  - '@claude'
created_date: '2026-10-30 10:55'
updated_date: '2026-10-30 11:00'
labels:
  - sync
milestone: m-0
dependencies: []
priority: high
type: bug
ordinal: 194000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Found in the second whole-project code review of 2026-10-30. `indexInWorker` in `app/src/lib/server/sync/sync.ts` (around lines 117-135) starts the indexing worker (`app/src/lib/server/sync/index-worker.ts`) and waits for its `message`, `error` or `exit` with no time limit. The expensive sync stage runs in a lane with exactly one slot (`createLimiter(1)` in `createSyncQueue`, `app/src/lib/server/sync/queue.ts` around line 52), so whatever keeps the worker busy holds up every source of every project; "sync now" for another source only queues behind it. Content of a docs repository can do this (see the task on the quadratic include and heading regexes), and the code itself treats docs repositories as untrusted ("anyone who can push to a docs branch", comment in `app/src/lib/server/sync/index-source.ts`). Consequences today: the run never ends, so no error is recorded and `sync_runs` gets no entry; the source page shows "sync pending" and polls every 2 s forever; the dashboard shows nothing; the running worker keeps the process alive on shutdown; and because `recordCheck` runs before the sync stage, the source becomes due again one schedule interval after a restart (five minutes by default) and stalls the lane again for as long as the commit is unchanged. A deadline turns this into an ordinary failed sync the admin can see.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 When indexing a source takes longer than a fixed limit, the worker is terminated and the sync ends as `failed` with a readable error that names the limit (e.g. "indexing took longer than N minutes")
- [x] #2 After such a timeout the sync lane is free: the next queued sync starts
- [x] #3 A normal sync is not affected; the limit is far above the time a large real source needs
- [x] #4 A test with a worker that never answers shows the sync fails with the timeout error and does not hang
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. indexInWorker gets a deadline (default 10 minutes, SyncOptions.indexingDeadlineMs as test seam): reject with "indexing took longer than …" and terminate the worker.
2. Verified first that terminate() rolls back the worker's open SQLite transaction and frees the lock.
3. Test with a 1 ms deadline through a single-slot lane, then a forced sync on the same lane succeeds.
4. Handbook admin.md names the limit.
<!-- SECTION:PLAN:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
indexInWorker now terminates the worker after 10 minutes (INDEXING_DEADLINE_MS) and the sync fails with "indexing took longer than 10 minutes"; the previous index stays live. Measured in a standalone script that Worker.terminate() rolls back the open transaction and releases the SQLite write lock. New sync.spec test runs a sync with a 1 ms deadline through a single-slot lane, checks the error on the result and the source, then a forced sync on the same lane succeeds (slot freed); it fails against the old code. All 71 sync specs pass, make lint and make handbook pass. Handbook admin.md states the limit.
<!-- SECTION:FINAL_SUMMARY:END -->
