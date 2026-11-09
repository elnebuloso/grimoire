---
id: TASK-120
title: Run include resolution in the indexing worker instead of the server thread
status: Done
assignee:
  - '@claude'
created_date: '2026-10-30 09:45'
updated_date: '2026-10-30 09:56'
labels:
  - sync
  - parsing
milestone: m-0
dependencies: []
priority: medium
type: bug
ordinal: 182000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Found in the whole-project code review of 2026-10-30. The indexing stage runs in a worker thread (`app/src/lib/server/sync/index-worker.ts`, started from `indexInWorker` in `app/src/lib/server/sync/sync.ts`, see the comment around lines 288-291) precisely so that heavy work does not block or crash the thread that answers HTTP requests. But `prepareCheckout` in `app/src/lib/server/sync/index-source.ts` runs in `sync.ts` before `indexInWorker`, on the main thread: `readdirSync`, `readFileSync` and the include expansion of every page, plus the URL include fetch loop. Large or hostile docs therefore stall request handling during a sync, and an out-of-memory there ends the whole server rather than just the sync. Note for the image: the worker is loaded from copied source files under `src/lib/server` (see `Dockerfile` and the comments in `index-worker.ts`); anything the worker imports must stay under `src/lib/server`, be imported with a `.ts` extension, and use production dependencies only.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Reading the checkout and expanding includes happen in the worker thread, not on the server thread
- [ ] #2 URL include fetches still honour the allowed origins and the per-sync cap
- [ ] #3 Sync results (pages, snippets, warnings, dead links) for the fixture sources are unchanged
- [ ] #4 Existing sync tests pass; a test or check shows the main thread no longer calls the include resolver during a sync
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. The worker job carries checkout, source path/exclusions, git remote and allowed include origins instead of prepared pages.
2. index-worker.ts runs prepareCheckout (with addSparseDirectories and fetchInclude) itself, then indexPages; index-source.ts imports with .ts extensions so plain Node loads it.
3. sync.ts only clones and hands over. sync.spec mocks the include resolver on the server thread to throw, so any main-thread use fails the sync tests.
4. Verify with fixture sources in the agent environment.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Agent environment after the change: platform/docs 4 pages, billing/docs 3 pages, no warnings, 3 dead links each; auth-service snippet carries the shared/ caution and def main without markers; billing/archive fails with 'source path "archive/docs" does not exist in the repository'. Matches the fixture README.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Reading the checkout, include resolution (including directory checkouts and URL fetches) and indexing now all run in the indexing worker; the server thread only checks, clones and swaps in the result. sync.spec replaces the include resolver on the server thread with one that throws: all sync tests pass now, 8 fail against the old code. Fixture sources in the agent environment give the expected pages, snippets, includes and dead links. The worker still imports only modules under src/lib/server with .ts extensions, so the image copy keeps working (to be checked by TASK-124's smoke run).
<!-- SECTION:FINAL_SUMMARY:END -->
