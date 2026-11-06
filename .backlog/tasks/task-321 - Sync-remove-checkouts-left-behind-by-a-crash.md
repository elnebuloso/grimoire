---
id: TASK-321
title: 'Sync: remove checkouts left behind by a crash'
status: Done
assignee:
  - '@claude'
created_date: '2026-11-06 20:52'
updated_date: '2026-11-06 21:30'
labels:
  - sync
  - ops
dependencies: []
references:
  - app/src/lib/server/sync/sync.ts
  - app/src/hooks.server.ts
priority: low
type: bug
ordinal: 383000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
`syncSource` in `app/src/lib/server/sync/sync.ts` creates a `grimoire-sync-*` directory with `mkdtemp` under `options.workDirectory ?? tmpdir()` and removes it in `finally`. If the server is killed during a clone or index (SIGKILL, OOM kill by the container – the code expects this elsewhere), the directory stays. Nothing cleans it at start (`init` in `app/src/hooks.server.ts`). For a large monorepo each crash leaves a full sparse clone, and the disk fills slowly on unstable hosts.

A blanket cleanup of `grimoire-sync-*` in the shared `tmpdir()` is not safe: `make e2e` runs a second instance (port 4174) whose live checkouts would be deleted.

Suggested fix: keep work directories under a directory owned by the instance (e.g. next to `DATABASE_PATH`) and empty it in `init`.

Found by a whole-repo audit on 2026-11-06 (commit 601c588 plus six local refactor commits).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Checkouts left by a previous process of the same instance are removed at start
- [x] #2 Checkouts of another instance on the same host are not touched
- [x] #3 A spec covers the cleanup at start
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Spec: freshWorkDirectory empties the directory of its database and leaves that of another database alone
2. sync.ts: freshWorkDirectory(databasePath, base = tmpdir()) = <base>/grimoire-work-<sha256 of the resolved path, 12 chars>, removed and created again
3. sync/index.ts: startSyncPolling (called by init) prepares it, and every queued sync clones into it
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
- Below tmpdir(), not next to DATABASE_PATH: clones stay off the data volume, and a hash of the database path still separates instances on one host (the second e2e instance has its own database).
- sync-logic.spec.ts, sync.spec.ts and the tests --changed reaches pass (82 tests).
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Syncs now clone into a work directory of their own database (below the temp directory, named after a hash of the database path), which the server empties when it starts, so clones left by a process killed during a sync no longer pile up. Another instance on the same host keeps its own directory. Covered by a spec of freshWorkDirectory.
<!-- SECTION:FINAL_SUMMARY:END -->
