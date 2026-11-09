---
id: TASK-122
title: Write last_synced_at only when an index is swapped in
status: Done
assignee:
  - '@claude'
created_date: '2026-10-30 09:45'
updated_date: '2026-10-30 10:00'
labels:
  - sync
  - admin
milestone: m-0
dependencies: []
priority: medium
type: bug
ordinal: 184000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Found in the whole-project code review of 2026-10-30. `recordSyncError` in `app/src/lib/server/db/sources.ts` (around line 237) sets `last_synced_at` to the time of a failure; a successful index swap also sets it (around line 193); an "unchanged" check does not. The column is read as "the index is from then" by `app/src/lib/server/admin/status.ts` (around line 209, `neverSynced` is `lastSyncedAt === null`) and by `app/src/lib/server/stats.ts` (lines 32-33, "Oldest sync" per project on the public start page and the dashboard). Consequences: a source that has never synced successfully (like the agent fixture `billing/archive`) shows a fresh "Last sync" time and is never called "never synced"; a source failing every five minutes for a month looks freshest of all in "Oldest sync", which exists to reveal stale indexes; after a failure followed by an "unchanged" check the error is cleared but "Last sync" shows the failure time. Attempts are already recorded by `last_checked_at` and the `sync_runs` history, so this column does not need to record them too.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 A failed sync no longer changes `last_synced_at`; only a successful index swap sets it
- [ ] #2 A source that has only ever failed shows as never synced on its page and on the dashboard, and is the oldest in "Oldest sync"
- [ ] #3 A migration resets `last_synced_at` of existing sources to the time of their newest successful run in `sync_runs`, or to NULL when there is none
- [ ] #4 Tests cover failure-only sources, failure after success, and the migration
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. recordSyncError stores only the error.
2. Migration 0019 sets last_synced_at to the newest 'synced' run in sync_runs; NULL when the source has no index (last_commit NULL); unchanged when it has an index but the trimmed history holds no successful run.
3. Tests: sync.spec for failure-only and failure-after-success, migrate.spec for the migration. Status and stats already treat NULL as never synced.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Migration deviates from the AC wording in one case on purpose: a source with an index (last_commit set) but no successful run left in its trimmed sync_runs history keeps its value instead of becoming NULL, which would call an indexed source never synced. Agent environment: billing/archive has last_synced_at NULL and the start page shows billing's oldest sync as 'not synced'.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Failed syncs no longer write last_synced_at; only an index swap does. Migration 0019 repairs existing rows from sync_runs. A source that only ever failed now counts as never synced on its page and the dashboard, and makes its project's 'Oldest sync' read 'not synced'. Tests cover failure-only, failure after success and the migration; checked in the agent environment with billing/archive.
<!-- SECTION:FINAL_SUMMARY:END -->
