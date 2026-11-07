---
id: TASK-348
title: 'Sync: an orphaned indexing process must not write after the server died'
status: Done
assignee:
  - '@claude'
created_date: '2026-11-06 23:46'
updated_date: '2026-11-07 00:21'
labels:
  - sync
dependencies: []
references:
  - app/src/lib/server/sync/index-worker.ts
  - app/src/lib/server/sync/sync.ts
priority: medium
type: bug
ordinal: 410000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
TASK-315 forks the indexing worker with `detached: true` (own process group); TASK-331 added `process.once('exit', stopWithServer)` in `indexInProcess` (`app/src/lib/server/sync/sync.ts`, around lines 216-221) to kill the group when the server exits. That does not cover Ctrl+C: Node emits no `exit` event when it dies of a signal it does not handle, and Vite registers only `SIGTERM` and stdin `end` (`node_modules/vite/bin/vite.js` deliberately has no `SIGINT` handler). So after Ctrl+C in `make dev` or the agent environment, the worker (`app/src/lib/server/sync/index-worker.ts`) keeps running; its `disconnect` handler runs only when its event loop is free, but `indexPages` and `replaceSourceIndex` run synchronously after its last await, so it writes the index and `last_commit` while the next server starts and empties the work directory (`freshWorkDirectory`). Shown with a scratch script: `process.once('exit', …)` followed by SIGINT to itself exits with 130 and the listener never runs. The TASK-331 spec calls `process.emit('exit')` by hand and cannot catch this.

Suggested fix: in `index-worker.ts`, remember `process.ppid` at start and `process.exit(1)` before `replaceSourceIndex` (and between pages if cheap) when `process.ppid` changed (the parent died). Decide whether the `exit` listener of TASK-331 stays (it still helps for `process.exit` on SIGTERM).

Found by the third whole-repo audit on 2026-11-07 (HEAD 4a72798).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 An indexing process whose server died before it writes exits without writing the index
- [x] #2 A normal indexing run writes the index as before
- [x] #3 A spec covers a worker whose parent is gone before the write (e.g. a stand-in parent process that exits)
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. IndexJob carries serverPid (sync.ts sends process.pid; the image smoke script too)
2. index-worker.ts exits with 1 before replaceSourceIndex when process.ppid is no longer serverPid
3. index-worker.spec.ts runs the real worker on a small checkout: with the test process as server it writes; with another pid as server it exits 1 and writes nothing
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
- Checked first: process.ppid is updated live after the parent dies (it becomes the subreaper). A pid taken at module load would not do: a server dying before the worker loads would leave a wrong start value, hence the pid in the job.
- The orphan spec fails with the guard removed (checked) and passes with it; all sync specs pass (178 tests); make image-smoke passes.
- The exit listener of TASK-331 stays: it still stops the group on process.exit (SIGTERM through Vite or adapter-node).
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
The indexing process now gets the pid of the server that started it and exits without writing when its parent is no longer that server, checked right before the index is written. A server killed by Ctrl+C, which never emits exit, no longer leaves an orphan writing the index while the next server starts. A spec runs the real worker with a matching and a foreign server pid; the image smoke test passes.
<!-- SECTION:FINAL_SUMMARY:END -->
