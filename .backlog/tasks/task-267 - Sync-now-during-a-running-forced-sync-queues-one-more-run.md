---
id: TASK-267
title: '"Sync now" during a running forced sync queues one more run'
status: To Do
assignee: []
created_date: '2026-11-05 23:04'
labels:
  - sync
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
- [ ] #1 "Sync now" while a forced sync of the same source is running queues exactly one more forced run, which starts after the running one ends
- [ ] #2 Further "Sync now" requests while that run waits share its result; no source ever has more than one run waiting
- [ ] #3 "Sync now" while a forced run is only waiting, not yet started, shares its result as today
- [ ] #4 Scheduled and other unforced requests keep their current behaviour
- [ ] #5 Covered in `queue.spec.ts`
<!-- AC:END -->
