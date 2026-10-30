---
id: TASK-152
title: Replace leftover worker-thread wording in sync comments and tests
status: Done
assignee:
  - '@claude'
created_date: '2026-10-30 13:41'
updated_date: '2026-10-30 14:05'
labels:
  - sync
milestone: m-0
dependencies: []
priority: low
type: chore
ordinal: 214000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Found by the whole-project code review of 2026-10-30 (13:25). Indexing moved from a worker thread to a child process (`fork`, see `indexInProcess` in `app/src/lib/server/sync/sync.ts`), but several places still speak of a worker thread: the doc comment in `app/src/lib/server/sync/index-pages.ts` (which also gives the worker thread as the reason for its import restriction), comments in `app/src/lib/server/sync/sync.spec.ts` (include resolution "belongs in the worker thread"; the index "is written by a worker thread"; "No worker starts"), and the test name "keeps the last good index when writing the new one fails in the worker". A reader of the import rule looks for `worker_threads` and finds `fork`.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 No comment or test name under `app/src/lib/server/sync/` describes indexing as running in a worker thread
- [x] #2 The import restriction in `index-pages.ts` gives the actual reason (the child process loads it with plain Node)
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Reword the comments in `index-pages.ts` and `sync.spec.ts` and the test name to the indexing child process; keep the comment above `indexInProcess` in `sync.ts`, which contrasts process and worker thread on purpose.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
`grep -rni "worker thread" app/src/lib/server/sync` leaves only `sync.ts` lines 140-142 (why a process and not a worker thread). `make lint` and `sync.spec.ts` (20 tests) pass.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Comments and one test name under `app/src/lib/server/sync/` no longer say indexing runs in a worker thread; `index-pages.ts` gives the real reason for its import restriction (the indexing child process is started by plain Node). Only the comment explaining why a process was chosen over a worker thread still names one.
<!-- SECTION:FINAL_SUMMARY:END -->
