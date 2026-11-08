---
id: TASK-383
title: >-
  Sync: do not retry a clone that timed out at every interval while it holds the
  only sync slot
status: Done
assignee:
  - '@claude'
created_date: '2026-11-08 16:44'
updated_date: '2026-11-08 17:04'
labels:
  - sync
dependencies: []
priority: medium
type: bug
ordinal: 445000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Git calls stop after `GIT_TIMEOUT_MS` = 5 minutes (`app/src/lib/server/sync/git.ts:21`); a killed clone is reported with the failure kind `unreachable` (`git.ts:226-229`). In `checkAndSync` (`app/src/lib/server/sync/sync.ts:121-173`) only failures after indexing started set `indexingCommit` and can be remembered as `failedCommit`, and `unreachable` is not in `REPEATING_KINDS`. `last_checked_at` is the start of the check, and the scheduler (`app/src/lib/server/sync/schedule.ts:26-33`) ticks every 15 seconds.

Case: a source on a large repository (path empty, the whole repository) or on a slow Git server. The clone is killed after 300 s, which is past the next `*/5` mark, so the next tick finds the source due again and clones for another 5 minutes, forever. There is one sync slot: every other source waits behind it in every round, N such sources add N × 5 minutes. The comment at sync.ts:121-122 names this hazard for indexing only.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 A clone or fetch that times out for a commit is not started again for the same commit at the next interval; it runs again once the branch moves, the source's Git settings change, or an admin clicks Sync now
- [x] #2 The source shows the timeout as its sync error, as today
- [x] #3 A spec in sync.spec.ts or sync-logic.spec.ts shows that a second scheduled check of the same commit after a clone timeout does not clone again
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. A Git call stopped at its time limit (message 'git … failed: no answer within …') counts as a failure that repeats on the same commit, next to REPEATING_KINDS.
2. A repeating failure before indexing started remembers the commit the check saw as failed_commit, so the next scheduled check skips it; Sync now (force), a new commit or saving changed index settings (clears failed_commit) retry.
3. Spec in sync-logic.spec.ts; handbook paragraph on commits not synced again.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
The kind stays 'unreachable', so the source shows the same summary and error as before (AC #2); the timeout is recognised by its message, which also survives the IPC boundary for a fetch timed out in the indexing process. Side effect: a 'path' failure raised by the clone is now remembered as well, as REPEATING_KINDS intends. New spec fails without the fix, passes with it; make test --changed: 286 passed.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
A clone or fetch stopped after its 5-minute limit no longer runs again at every interval: the commit is remembered as failed and skipped until the branch moves, the index settings change or an admin clicks Sync now. The error shown is unchanged. Spec in sync-logic.spec.ts (fails before, passes after); handbook paragraph on commits not synced again updated.
<!-- SECTION:FINAL_SUMMARY:END -->
