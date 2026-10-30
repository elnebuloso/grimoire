---
id: TASK-76
title: '"Sync now" holds the HTTP request open for the whole queue and sync'
status: To Do
assignee:
  - '@claude'
created_date: '2026-10-30 00:14'
labels:
  - sync
milestone: m-0
dependencies:
  - TASK-75
references:
  - app/src/lib/server/sync/queue.ts
priority: medium
type: bug
ordinal: 138000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Found by a code review on 2026-10-30.

The "sync now" action in `app/src/routes/manage/projects/[id]/sources/[sourceId]/+page.server.ts:140-144` awaits `requestSync`. The sync lane runs one source at a time (`app/src/lib/server/sync/queue.ts:51-52`), so the request waits for every queued sync, then a clone and indexing. The handbook puts grimoire behind a reverse proxy, which commonly cuts idle requests after about 60 s; the admin then sees a gateway error while the sync continues and later succeeds or fails silently.

Review suggestion: queue without awaiting, as the save action already does, and show the result through the source status the page already loads (`error`, `last_synced_at`).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 "Sync now" returns as soon as the sync is queued
- [ ] #2 The page shows that a sync is queued or running, and its outcome via the existing source status
- [ ] #3 Tests cover the action returning without waiting for the sync
<!-- AC:END -->
