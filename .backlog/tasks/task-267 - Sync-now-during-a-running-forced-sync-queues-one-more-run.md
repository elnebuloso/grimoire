---
id: TASK-267
title: '"Sync now" during a running forced sync queues one more run'
status: Done
assignee:
  - '@claude'
created_date: '2026-11-05 23:04'
updated_date: '2026-11-06 09:02'
labels:
  - sync
milestone: m-3
dependencies: []
priority: medium
type: bug
ordinal: 329000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
A forced sync ("Sync now") that is already running answers every further "Sync now" for the same source with its own result (`createSyncQueue` in `app/src/lib/server/sync/queue.ts`). A commit pushed after the running sync checked the branch is therefore not indexed until the next scheduled run, although the admin asked for the latest state. Found in TASK-250; owner decision: queue one more run, but never more than one per source. Work on the branch `redesign`.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 "Sync now" while a forced sync of the same source is running queues exactly one more forced run, which starts after the running one ends
- [x] #2 Further "Sync now" requests while that run waits share its result; no source ever has more than one run waiting
- [x] #3 "Sync now" while a forced run is only waiting, not yet started, shares its result as today
- [x] #4 Scheduled and other unforced requests keep their current behaviour
- [x] #5 Covered in `queue.spec.ts`
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
Rules (shown to the owner 2026-11-06, go):
1. Sync now while a forced sync of the source runs: queue exactly one more forced run, started after the running one ends.
2. Sync now while a forced run waits behind a running one: share the waiting run's result; never more than one waiting per source.
3. Unforced run running: forced queued after it, as today.
4. Unforced requests share whatever is pending, as today.
5. isPending stays true across the chain; the page shows syncing until the queued run ends.
6. createSyncQueue tracks per source whether its job has started.
7. queue.spec.ts: a test each for 1, 2, 3; the test for 1 fails first.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
A job records whether its run has started. A forced request queues a new run behind a started job and shares a forced job that only waits; unforced requests share whatever is pending. "Started" means the run was called, which includes waiting for a check slot; a forced request then queues one run more than needed, which costs one extra check.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
"Sync now" while a forced sync of the same source runs now queues exactly one more forced run after it; further requests share that waiting run. Unforced requests and a forced request behind an unforced run behave as before. Regression test in queue.spec.ts (failed before the fix). make lint, make test (1052) and make e2e (28) pass.
<!-- SECTION:FINAL_SUMMARY:END -->
