---
id: TASK-75
title: One place for background sync requests and the "syncs automatically" rule
status: To Do
assignee:
  - '@claude'
created_date: '2026-10-30 00:14'
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
- [ ] #1 Routes queue a background sync through one function next to `requestSync` in `app/src/lib/server/sync/index.ts`, with one log message
- [ ] #2 Whether a source syncs automatically is answered by one function used by the routes
- [ ] #3 Existing tests pass unchanged in behaviour
<!-- AC:END -->
