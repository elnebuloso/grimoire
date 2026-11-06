---
id: TASK-348
title: 'Sync: an orphaned indexing process must not write after the server died'
status: To Do
assignee: []
created_date: '2026-11-06 23:46'
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
- [ ] #1 An indexing process whose server died before it writes exits without writing the index
- [ ] #2 A normal indexing run writes the index as before
- [ ] #3 A spec covers a worker whose parent is gone before the write (e.g. a stand-in parent process that exits)
<!-- AC:END -->
