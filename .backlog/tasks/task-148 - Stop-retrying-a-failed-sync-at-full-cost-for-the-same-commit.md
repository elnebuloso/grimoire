---
id: TASK-148
title: Stop retrying a failed sync at full cost for the same commit
status: To Do
assignee:
  - '@claude'
created_date: '2026-10-30 13:41'
labels:
  - sync
milestone: m-0
dependencies: []
priority: high
type: bug
ordinal: 210000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Found by the whole-project code review of 2026-10-30 (13:25). Indexing is killed after a fixed 10 minutes (`INDEXING_DEADLINE_MS` in `app/src/lib/server/sync/sync.ts`), and the run ends as `failed` with `indexing took longer than 10 minutes`. But nothing remembers that this commit already failed, so the next tick tries the same commit again, for another 10 minutes, forever:

- `last_commit` is only set by a successful swap (`db/sources.ts`), so the next check in `checkAndSync` (`sync.ts`) sees `latest !== source.lastCommit` again.
- `recordCheck` stores the time the check *started*. After a 10-minute run the source is already overdue under the default `SYNC_SCHEDULE` `*/5 * * * *`, and the next 15-second tick (`TICK_MS` / `dueSources` in `sync/index.ts`) queues it again.
- `syncSource` stores a failed run in the sync history with `commit: null`, so not even the history shows that the same commit failed.

The sync lane has one slot (`createSyncQueue` in `sync/queue.ts`, `sync: createLimiter(1)`). Other sources still get their turn (the limiter is FIFO), but each waits behind up to 10 minutes of hopeless indexing every round, and one core is busy all the time. Two kinds of source end up here: hostile or broken content (anyone who can push to a docs branch controls the input; see the quadratic parser paths tracked separately), and a legitimately large source on a small CPU limit: `docs/handbook/docker.md` (Memory and CPU limits) measures the Kubernetes docs at 383 s with 0.5 CPU, so a source 1.6 times that size never finishes on such a pod. The same applies, at lower cost, to an indexing child process killed for running out of memory: it is started again at the next schedule with the same commit.

The 10 minutes are a constant, so an operator cannot raise them. The handbook names the error in `docs/handbook/admin.md` (table of sync errors) and the limits in `docs/handbook/docker.md`.

Possible approaches (the worker decides): store the commit whose sync stage failed (the check knows it as `latest`, so `recordSyncError` can take it along) and skip the sync stage while `latest` equals it unless the run is forced ("sync now" and a changed setting pass `force: true`); or back off exponentially after consecutive failures. The existing deadline test in `app/src/lib/server/sync/sync.spec.ts` (`indexingDeadlineMs: 1`) is a suitable seam.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 A source whose sync stage failed is not cloned and indexed again by an unforced run while the remote branch still points at the commit that failed; a test with `indexingDeadlineMs: 1` shows a second unforced run at the same commit starts no indexing process
- [ ] #2 A forced run ("sync now", or a change to the source settings) still tries the failed commit again
- [ ] #3 A new commit on the branch is synced normally after a failure
- [ ] #4 The admin still sees the failure and its error on the source while the commit is skipped
- [ ] #5 The indexing deadline is configurable by an environment variable declared in `app/src/env.ts`, listed in `app/.env.example`, documented in `docs/handbook/docker.md`, with the error row in `docs/handbook/admin.md` matching the actual message
<!-- AC:END -->
