---
id: TASK-8
title: Polling scheduler
status: Done
assignee:
  - '@claude'
created_date: '2026-10-28T19:31:00Z'
updated_date: '2026-10-28T21:00:00Z'
labels:
  - sync
milestone: m-0
dependencies:
  - TASK-7
documentation:
  - docs/konzept.md
priority: medium
type: feature
ordinal: 8000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Changes in the repos must reach grimoire without webhooks (provider formats differ). Polling runs in the same process; the admin area also needs a way to start a sync immediately.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 All sources are checked periodically; the interval comes from an environment variable and defaults to 5 minutes
- [x] #2 A source is never synced twice at the same time
- [x] #3 A sync can be started for a single source on demand
- [x] #4 One failing source does not stop the others
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. `app/src/lib/server/sync/queue.ts`: `createSyncQueue(run)` runs syncs strictly one after another (one write lock, never the same source twice at once). A request for a source already waiting returns that job; a forced request for a source with only an unforced job pending is queued after it, so "sync now" is never swallowed by a poll. A failing job rejects its own promise only.
2. `startPolling(queue, listSources, intervalMs)`: enqueues every source at start and then per interval; a rejected job is logged and the round goes on. Returns a stop function.
3. `SYNC_INTERVAL_MINUTES` in `app/src/env.ts`, default 5, positive number.
4. `sync/index.ts` wires the queue to `syncSource` with the database and key and exports `requestSync(sourceId, { force })` for the admin area; `hooks.server.ts` starts polling after the `MIGRATE_ONLY` exit.
5. Tests with a fake `run` and fake timers: serial execution, dedupe, forced request, failure isolation, interval.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Handoff from TASK-7: call `syncSource(database(), sourceId, { key: TOKEN_ENCRYPTION_KEY })` (`app/src/lib/server/sync/sync.ts`) per source; it never throws for sync problems but returns `{ status: unchanged | synced | failed }` and stores errors itself. Sync sources one after another: each holds the write lock while replacing its index.

Found in the end-to-end run: the polling interval kept the event loop alive, so the built server ignored SIGTERM until killed. Fixed with `unref()`; a regression test runs `startPolling` in a child process and expects it to exit on its own (failed before the fix). The built server now exits 267 ms after SIGTERM.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Added `createSyncQueue` and `startPolling` in `app/src/lib/server/sync/queue.ts`. The queue runs syncs strictly one after another, shares a pending job for the same source, and queues a forced request behind a pending unforced one so "sync now" is never swallowed by a poll; a failing job rejects only its own promise. Polling enqueues every source at start and every `SYNC_INTERVAL_MINUTES` (declared in `app/src/env.ts`, default 5), logs failed syncs and failed listings and goes on; its timer is unreferenced so shutdown is not blocked. `sync/index.ts` wires the queue to `syncSource` and exports `requestSync(sourceId, { force })`; `hooks.server.ts` starts polling after the `MIGRATE_ONLY` exit. `.env.example` and `docs/handbook/database.md` document the variable. Verified: 7 tests in `queue.spec.ts` (96 in total), `make lint`, `make build`; end-to-end with the built server against a local repository polling every 3 s – the first poll indexed the source, a pushed commit appeared after the next one – and the server exits on SIGTERM.
<!-- SECTION:FINAL_SUMMARY:END -->
