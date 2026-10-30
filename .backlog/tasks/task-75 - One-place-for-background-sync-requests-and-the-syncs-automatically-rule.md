---
id: TASK-75
title: One place for background sync requests and the "syncs automatically" rule
status: Done
assignee:
  - '@claude'
created_date: '2026-10-30 00:14'
updated_date: '2026-10-30 00:36'
labels:
  - sync
milestone: m-0
dependencies: []
references:
  - app/src/lib/server/sync/index.ts
  - app/src/lib/server/db/sources.ts
priority: low
type: chore
ordinal: 137000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Found by a code review on 2026-10-30.

- `requestSync(id, { force: true }).catch(... log.error ...)` is copied four times: the source page `save` and `slug` actions, the project page `slug` action, and the wizard `create` action (all under `app/src/routes/manage/`). The log message already differs per route.
- "Should this source sync now" (`!form.paused && !readSettings(db).syncsPaused`) is decided in two routes and again in SQL in `listSchedules` (`app/src/lib/server/db/sources.ts:59-72`).

The next rule (say, "not while a source has no token") would have to be added in three places.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Routes queue a background sync through one function next to `requestSync` in `app/src/lib/server/sync/index.ts`, with one log message
- [x] #2 Whether a source syncs automatically is answered by one function used by the routes
- [x] #3 Existing tests pass unchanged in behaviour
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. createSyncQueue gets requestInBackground (queue without awaiting, log a failure); sync/index.ts exports it as requestSyncInBackground; startPolling uses it as well.
2. settings.ts gets syncsAutomatically(db, source); both routes use it. listSchedules keeps its SQL filter, documented as the same rule for all sources at once.
3. Route tests mock requestSyncInBackground; settings.spec tests the rule.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
The log message is now one string, 'sync of source <id> failed', for routes and polling alike. startPolling takes only Pick<SyncQueue, 'requestInBackground'>. Route test assertions moved from requestSync to requestSyncInBackground; the paused/all-paused cases keep their meaning because syncsAutomatically is not mocked. The polling failure-logging test now runs against a real createSyncQueue, so it covers the logging in requestInBackground.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Queueing a sync without waiting for it is now requestSyncInBackground (sync/index.ts, backed by the queue's requestInBackground), used by the four route call sites and by polling, with one log message. Whether a source syncs on its own is syncsAutomatically in settings.ts, used by the source page and the wizard; listSchedules keeps the same rule in SQL. No behaviour change. Verified with make lint and make test (477 passed).
<!-- SECTION:FINAL_SUMMARY:END -->
