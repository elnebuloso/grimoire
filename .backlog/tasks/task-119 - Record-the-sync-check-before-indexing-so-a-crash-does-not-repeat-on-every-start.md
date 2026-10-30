---
id: TASK-119
title: >-
  Record the sync check before indexing so a crash does not repeat on every
  start
status: Done
assignee:
  - '@claude'
created_date: '2026-10-30 09:45'
updated_date: '2026-10-30 09:51'
labels:
  - sync
milestone: m-0
dependencies: []
priority: high
type: bug
ordinal: 181000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Found in the whole-project code review of 2026-10-30. In `app/src/lib/server/sync/sync.ts` the check time `last_checked_at` is written only in the `finally` block (around line 284) after the sync stage, and `last_commit` only after a successful index swap. If the process dies during a sync (for example out of memory while expanding includes, or a native crash), neither is recorded. After the restart `startPolling` in `app/src/lib/server/sync/queue.ts` (around line 157) polls right away, the source is due again, the same commit is cloned and processed again, and the process dies again. The instance is then in a crash loop that the admin UI cannot break, because it is never up long enough to pause the source; the only way out is editing the database by hand. Recording the check before the expensive stage costs at most one schedule interval per crash instead of every start.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 The check time of a source (`recordCheck`) is written before the fetch and index stage starts, so a process that dies during the sync does not find the source due again right after a restart
- [ ] #2 A sync that completes normally still records its check time, result and sync history entry as before
- [ ] #3 A test shows that a source whose sync was interrupted (check recorded, no completion) is not due again until its schedule interval has passed
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
Call recordCheck inside the check lane as soon as the check starts, keeping the finally for runs that never reach the check. Test with a sync lane that never finishes.
<!-- SECTION:PLAN:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
syncSource records last_checked_at when the check starts, before the clone and index stage, so a process dying during a sync no longer finds the source due on restart. The finally still records it for runs that fail before the check. New test: with a sync stage that never finishes, the check is already recorded and the source is not due; it fails without the change. Existing check-time and history tests pass.
<!-- SECTION:FINAL_SUMMARY:END -->
