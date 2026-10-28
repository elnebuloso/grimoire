---
id: TASK-27
title: Sync 200 sources within one polling interval
status: Done
assignee:
  - '@claude'
created_date: '2026-10-28T21:03:00Z'
updated_date: '2026-10-28T21:08:00Z'
labels:
  - sync
milestone: m-0
dependencies:
  - TASK-8
documentation:
  - docs/konzept.md
priority: medium
type: enhancement
ordinal: 27000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
grimoire is planned for about 200 sources. Syncs ran strictly one after another (`app/src/lib/server/sync/queue.ts`), and every git call could take up to 5 minutes. One unresponsive Git server therefore stalled the whole queue, and checking 200 sources one by one may not fit into the default 5-minute polling interval. A check (`git ls-remote`) only waits on the network; clone, parsing and writing the index cost disk, CPU and the single SQLite write lock.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Checks of different sources run in parallel, at most 4 at a time
- [x] #2 Clone, indexing and writing still run for one source at a time
- [x] #3 A check that gets no answer gives up after 30 seconds and is stored as the error of that source; a clone keeps the longer timeout
- [x] #4 A source is still never synced twice at the same time, and a forced sync is not swallowed by a pending poll
- [x] #5 Tests cover the limit of parallel checks, the serial sync stage and a hanging check
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. `git.ts`: per-call timeout; `remoteCommit` uses 30 s, clone and sparse-checkout keep 5 min.
2. `queue.ts`: a small `createLimiter(max)`; the queue owns two lanes, `check` (4) and `sync` (1), and passes them to `run`. Per-source dedupe stays; a forced request chains behind the pending job of the same source instead of behind the global tail.
3. `sync.ts`: `syncSource` takes the lanes as an option (default: run immediately) and runs `ls-remote` in `check`, clone + index + write in `sync`.
4. Tests in `queue.spec.ts` with fake lanes timing; `git.spec.ts` or `sync.spec.ts` for the check timeout.
<!-- SECTION:PLAN:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
The sync queue (`app/src/lib/server/sync/queue.ts`) now has two lanes built from a small `createLimiter`: `check` runs up to 4 `ls-remote` calls at once, `sync` runs clone, indexing and writing for one source at a time. The limiter hands a freed slot straight to the next waiter, so the limit holds. Per-source dedupe stays; a forced request now chains behind the pending job of the same source. `syncSource` takes the lanes as an option (default: immediately) and runs each stage in its lane; the temporary checkout is removed inside the sync lane. `remoteCommit` gives up after 30 s (`CHECK_TIMEOUT_MS`), clones keep 5 min, and a timeout reads "no answer within N s". `docs/handbook/database.md` describes the behaviour. Verified: tests for the limiter, 10 sources (highest 4 checks, 1 sync at once), dedupe, forced chaining, failure isolation, and a check against a TCP server that never answers (98 tests, stable over three runs); `make lint`; built server with three local sources indexed all three and exited 0 on SIGTERM.
<!-- SECTION:FINAL_SUMMARY:END -->
