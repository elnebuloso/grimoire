---
id: TASK-328
title: 'Sync: a passing failure clears an older failed commit so the commit is retried'
status: To Do
assignee: []
created_date: '2026-11-06 22:05'
labels:
  - sync
dependencies: []
references:
  - app/src/lib/server/sync/sync.ts
  - app/src/lib/server/db/sources.ts
priority: medium
type: bug
ordinal: 390000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Since TASK-309, `checkAndSync` in `app/src/lib/server/sync/sync.ts` passes the commit to `recordSyncError` only for failures that repeat (`REPEATING_KINDS`: `noPage`, `path`, `deadline`, `aborted`). For any other failure it passes no commit, and `recordSyncError` in `app/src/lib/server/db/sources.ts` then updates only `error` and `error_kind` and leaves `failed_commit` as it was.

Case: commit X fails with `deadline`, so `failed_commit = X`. An admin clicks "Sync now"; the forced run fails for a passing reason (network error in `addSparseDirectories`, a locked database). `failed_commit` stays X, and every later scheduled check hits the early return `latest === source.failedCommit && source.error && !options.force` and reports the passing error without retrying. The handbook (`docs/handbook/admin.md`, section on sync failures) says such failures are retried at the next check.

Suggested fix: when indexing started (`indexingCommit` set) and the failure does not repeat, write `failed_commit = NULL`; failures before indexing (check stage, `indexingCommit` undefined) keep leaving it alone.

Found by the second whole-repo audit on 2026-11-06 (HEAD 06aada8).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 After a repeating failure of commit X and a later passing failure while indexing X, the next scheduled check indexes X again
- [ ] #2 A repeating failure still blocks the commit until forced or a new commit arrives
- [ ] #3 A failure before indexing started leaves `failed_commit` unchanged
- [ ] #4 Specs in `sync-logic.spec.ts` cover the sequence
<!-- AC:END -->
