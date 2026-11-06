---
id: TASK-328
title: 'Sync: a passing failure clears an older failed commit so the commit is retried'
status: Done
assignee:
  - '@claude'
created_date: '2026-11-06 22:05'
updated_date: '2026-11-06 22:29'
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
- [x] #1 After a repeating failure of commit X and a later passing failure while indexing X, the next scheduled check indexes X again
- [x] #2 A repeating failure still blocks the commit until forced or a new commit arrives
- [x] #3 A failure before indexing started leaves `failed_commit` unchanged
- [x] #4 Specs in `sync-logic.spec.ts` cover the sequence
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Specs: after a deadline failure of c1, a forced run failing with noAddress lets the next scheduled sync index c1; a check failure before indexing keeps failed_commit
2. recordSyncError takes null to forget the remembered commit; sync.ts passes null for a passing failure once indexing started, undefined before
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
- The retry spec failed before and passes after; the keep spec guards the check-stage case. sync-logic, sync and db/sources specs pass (39 tests).
- The handbook sentence in admin.md (other failures while indexing are retried at the next check) now holds.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
A failure while indexing that does not repeat now forgets a commit remembered as failed earlier, so after a deadline failure of a commit and a forced run that fails on the network, the next scheduled check indexes the commit again, as the handbook says. A failure before indexing started (the remote check) still leaves the remembered commit alone. Specs in sync-logic.spec.ts cover both.
<!-- SECTION:FINAL_SUMMARY:END -->
