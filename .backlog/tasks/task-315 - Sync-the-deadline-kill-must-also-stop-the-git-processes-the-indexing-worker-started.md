---
id: TASK-315
title: >-
  Sync: the deadline kill must also stop the git processes the indexing worker
  started
status: Done
assignee:
  - '@claude'
created_date: '2026-11-06 20:51'
updated_date: '2026-11-06 21:20'
labels:
  - sync
dependencies: []
references:
  - app/src/lib/server/sync/sync.ts
  - app/src/lib/server/sync/git.ts
priority: medium
type: bug
ordinal: 377000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
When indexing runs past its deadline, `indexInProcess` in `app/src/lib/server/sync/sync.ts` kills the forked worker with `child.kill('SIGKILL')` and then removes the checkout (`rm(checkout, …)`). The worker may be running a git child of its own, e.g. `git sparse-checkout add` to fetch include directories (`app/src/lib/server/sync/git.ts`, started via `execFile` with a timeout). SIGKILL reaches only the worker: the git process keeps running, and its timeout timer lived in the dead worker, so nothing stops it if the Git server hangs. Meanwhile `rm` runs against a directory git is still writing into (guess, not reproduced: it can leave the temp directory behind or fail with ENOTEMPTY, replacing the deadline error with a meaningless one).

Case: a large monorepo whose indexing deadline hits during an include-directory fetch.

Suggested fix: fork the worker with `detached: true` and kill the whole process group with `process.kill(-child.pid, 'SIGKILL')`.

Found by a whole-repo audit on 2026-11-06 (commit 601c588 plus six local refactor commits).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 After a deadline kill, no git process started by the worker is still running
- [x] #2 The checkout directory is removed after a deadline kill and the stored error is the deadline error
- [x] #3 A spec in `sync.spec.ts` covers a worker whose git child outlives the deadline
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Test seam: SyncOptions.indexingScript replaces the indexing script; a stand-in that starts `sleep 60` and never answers
2. Spec in sync.spec.ts: after the deadline the started child is gone and the work directory is empty
3. fork the worker with detached: true and kill its process group on the deadline, guarded against a missing pid or a group already gone
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
- Counter-test: with the old `child.kill('SIGKILL')` and no detached fork the spec fails (the child outlives the deadline); with the change it passes. sync.spec.ts and sync-logic.spec.ts pass (25 tests).
- killGroup swallows ESRCH and skips an unknown pid: the deadline timer must never throw in the server.
- A detached worker still exits when the server goes away: it listens for the IPC disconnect.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
The indexing process now runs in its own process group, and the deadline kills the whole group, so a git the worker started (fetching include directories) no longer keeps running without its timeout after the deadline, and the checkout is removed after it. The kill skips a missing pid and a group that already ended. A spec with a stand-in worker that starts a long-running child covers it; it fails with the old kill.
<!-- SECTION:FINAL_SUMMARY:END -->
