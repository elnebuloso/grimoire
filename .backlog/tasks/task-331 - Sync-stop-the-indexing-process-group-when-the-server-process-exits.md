---
id: TASK-331
title: 'Sync: stop the indexing process group when the server process exits'
status: Done
assignee:
  - '@claude'
created_date: '2026-11-06 22:05'
updated_date: '2026-11-06 22:35'
labels:
  - sync
dependencies: []
references:
  - app/src/lib/server/sync/sync.ts
  - app/src/lib/server/sync/index-worker.ts
priority: medium
type: bug
ordinal: 393000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Since TASK-315, `indexInProcess` in `app/src/lib/server/sync/sync.ts` forks the indexing worker with `detached: true` (own process group) so the deadline can kill it together with the git it started (`killGroup`). Side effect: a signal to the server's process group – Ctrl+C in `make dev` or the agent environment – no longer reaches the worker. Its `disconnect` handler (`app/src/lib/server/sync/index-worker.ts`) runs only when its event loop is free, but after its last await `indexPages` and `replaceSourceIndex` run synchronously. The orphan finishes – up to about a minute for a large source – writes the index and `last_commit`, and only then exits, while the next server process already starts and empties the work directory (`freshWorkDirectory`). Git processes the worker started are orphaned too. Shown with a scratch parent/child pair: with `detached` the child finished its synchronous work after SIGINT to the parent's group; without, it died with the group. In Docker or Kubernetes the whole container is killed, so this mainly affects dev and non-container runs.

Suggested fix: in `indexInProcess`, register `process.once('exit', stop)` with `stop = () => killGroup(child.pid)` and remove it in the `close` handler.

Found by the second whole-repo audit on 2026-11-06 (HEAD 06aada8).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 When the server process exits while indexing runs, the indexing process and the processes it started are killed
- [x] #2 A finished indexing run leaves no exit handler behind
- [x] #3 A spec in `sync.spec.ts` (with the `indexingScript` stand-in) or a scripted check covers it
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Spec with the indexingScript stand-in: emitting the process exit event stops the stand-in and the child it started; the deadline spec checks that the exit listener is gone once the indexing process ended
2. indexInProcess registers process.once('exit') to kill the worker group and removes it on close
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
- The exit spec failed before and passes after; sync.spec.ts and sync-logic.spec.ts pass twice in a row (29 tests).
- The listener count is checked in the deadline spec, not after the emitted exit: emitting exit also removes other once-listeners of the test process.
- Covers process.exit and a graceful shutdown (adapter-node and Vite call process.exit on SIGINT/SIGTERM); a SIGKILL of the server cannot be handled, as before.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
When the server process exits while a source is being indexed, it now kills the indexing process group with it, so the worker and the git it started no longer finish as orphans writing to the database while the next server starts (Ctrl+C in make dev). The exit listener is removed once indexing ends. A spec with a stand-in worker covers the exit; the deadline spec checks the cleanup.
<!-- SECTION:FINAL_SUMMARY:END -->
