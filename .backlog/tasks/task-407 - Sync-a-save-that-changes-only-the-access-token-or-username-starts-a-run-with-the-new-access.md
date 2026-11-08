---
id: TASK-407
title: >-
  Sync: a save that changes only the access token or username starts a run with
  the new access
status: To Do
assignee: []
created_date: '2026-11-08 19:51'
labels:
  - sync
  - admin
dependencies: []
priority: low
type: bug
ordinal: 469000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Found by the audit of 2026-11-08 (three independent reviewers, the severe findings re-checked by reading). Saving a source requests a sync (`app/src/routes/manage/sources/[id]/[[tab=tab]]/+page.server.ts` around line 175, `app/src/lib/server/admin/sources.ts` around line 297). When only the token or username changed and a sync of that source is running, the save is not forced, so the queue (`app/src/lib/server/sync/queue.ts` around line 336) hands back the running run, which still uses the old access. Case: the old token is already revoked and no error is stored yet; right after saving a working token the admin sees the Git host refuse username and token, and nothing retries until the next scheduled check. The window is narrow (confirmed by reading only). Fix shape: an option to `request` that does not share an already started run but does not force a full re-index either, used when the save changed access.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 A save that changes token or username while that source syncs leads to one more run with the new access after the running one, without a forced full re-index
- [ ] #2 A save that changes nothing about access still shares the running run as before
- [ ] #3 A spec in `queue.spec.ts` covers both
<!-- AC:END -->
