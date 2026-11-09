---
id: TASK-95
title: Show the result of "Sync now" without a manual reload
status: Done
assignee:
  - '@claude'
created_date: '2026-10-30 02:01'
updated_date: '2026-10-30 02:37'
labels:
  - admin
  - sync
milestone: m-0
dependencies: []
references:
  - 'app/src/routes/manage/projects/[id]/sources/[sourceId]/+page.svelte'
priority: low
type: enhancement
ordinal: 157000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
After "Sync now" the source page says a sync is queued or running and asks the admin to reload the page for its result.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 While a sync of the source is pending, the page refreshes its data on its own at a short interval
- [x] #2 Refreshing stops once the sync has finished and the page shows the new state
- [x] #3 Without JavaScript the page still works as today
- [x] #4 The message no longer asks for a reload where the page refreshes by itself
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Source page: while data.syncPending, an $effect calls invalidateAll() every 2 s; the effect's cleanup stops it once the sync is done or the page is left.
2. The pending message drops the reload request; a <noscript> keeps it for browsers without JavaScript, where the page still works by reloading.
3. e2e: after 'Sync now' the outcome appears without page.reload().
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
An $effect on the source page runs invalidateAll every 2 s while data.syncPending and clears the interval in its cleanup once the flag is gone. The reload request moved into a <noscript>. Verified: make e2e (the 'Sync now' test no longer reloads and sees the error appear on its own), make lint; by hand in the agent environment on platform/next: 7 polls, then no further __data.json requests, and a value typed into the branch field during polling stays.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
After 'Sync now' the source page refreshes its data every 2 s while the sync is queued or running and stops once the outcome is in; the message no longer asks for a reload, except in a <noscript> for browsers without JavaScript. Verified with make e2e (test now relies on it), make lint and by hand (polling stops, typed input survives).
<!-- SECTION:FINAL_SUMMARY:END -->
