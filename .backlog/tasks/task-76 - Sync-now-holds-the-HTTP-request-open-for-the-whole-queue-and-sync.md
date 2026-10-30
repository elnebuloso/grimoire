---
id: TASK-76
title: '"Sync now" holds the HTTP request open for the whole queue and sync'
status: Done
assignee:
  - '@claude'
created_date: '2026-10-30 00:14'
updated_date: '2026-10-30 00:43'
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
- [x] #1 "Sync now" returns as soon as the sync is queued
- [x] #2 The page shows that a sync is queued or running, and its outcome via the existing source status
- [x] #3 Tests cover the action returning without waiting for the sync
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. queue.isPending / syncPending(sourceId) exposes whether a sync is queued or running.
2. The sync action queues with requestSyncInBackground and redirects 303 to the page (Post/Redirect/Get), so a reload for the outcome does not queue another sync.
3. The page shows source_sync_pending while pending; the outcome shows in the existing status (last sync, commit, error). The old result messages are removed.
4. Unit tests (queue.isPending, route), e2e updated, handbook admin.md updated.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Found while running make e2e: without the redirect, reloading the POST result re-submitted the form (forms are not enhanced), queued a new sync each time and the page stayed pending forever. The redirect fixes that; e2e now reloads until the pending message is gone and checks the error in the status.

Removed messages source_sync_failed, source_synced, source_unchanged (en, de); they had no other use.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
"Sync now" no longer holds the HTTP request open for the whole queue and sync. It queues the sync, redirects back to the source page, and the page says a sync is queued or running until it is done. The outcome shows in the existing status. Verified by unit tests (queue.isPending, the sync action), the updated e2e test (make e2e: 15 passed), make lint and make test (478 passed), and by hand in the agent environment (pending for about 4 s, then gone). Handbook admin.md describes the new behaviour.
<!-- SECTION:FINAL_SUMMARY:END -->
