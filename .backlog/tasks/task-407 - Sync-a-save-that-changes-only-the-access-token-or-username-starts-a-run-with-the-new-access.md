---
id: TASK-407
title: >-
  Sync: a save that changes only the access token or username starts a run with
  the new access
status: Done
assignee:
  - '@claude'
created_date: '2026-11-08 19:51'
updated_date: '2026-11-08 20:58'
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
- [x] #1 A save that changes token or username while that source syncs leads to one more run with the new access after the running one, without a forced full re-index
- [x] #2 A save that changes nothing about access still shares the running run as before
- [x] #3 A spec in `queue.spec.ts` covers both
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
request in queue.ts takes `fresh`: like a forced request it does not share a run that has started, but runs unforced; a run still waiting is shared, as it reads the settings when it starts (same rule as before for forced requests). The save action passes fresh: changes.access. An unchanged run clears the stored sync error (clearSyncError), so the run with the new token removes a refusal the old run stored. Specs: queue.spec.ts "runs once more without forcing after a running sync when asked for a fresh one" fails without the change; sources.spec.ts asserts { force, fresh } on create, resave and a token-only change.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Saving a source whose username or token changed now queues one more, unforced run after a sync of that source already running, so the new access is used right away instead of at the next scheduled check. Queue and route specs updated.
<!-- SECTION:FINAL_SUMMARY:END -->
