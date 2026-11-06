---
id: TASK-331
title: 'Sync: stop the indexing process group when the server process exits'
status: To Do
assignee: []
created_date: '2026-11-06 22:05'
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
- [ ] #1 When the server process exits while indexing runs, the indexing process and the processes it started are killed
- [ ] #2 A finished indexing run leaves no exit handler behind
- [ ] #3 A spec in `sync.spec.ts` (with the `indexingScript` stand-in) or a scripted check covers it
<!-- AC:END -->
