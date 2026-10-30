---
id: TASK-152
title: Replace leftover worker-thread wording in sync comments and tests
status: To Do
assignee:
  - '@claude'
created_date: '2026-10-30 13:41'
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
- [ ] #1 No comment or test name under `app/src/lib/server/sync/` describes indexing as running in a worker thread
- [ ] #2 The import restriction in `index-pages.ts` gives the actual reason (the child process loads it with plain Node)
<!-- AC:END -->
