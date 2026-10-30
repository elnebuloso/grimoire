---
id: TASK-95
title: Show the result of "Sync now" without a manual reload
status: To Do
assignee: []
created_date: '2026-10-30 02:01'
updated_date: '2026-10-30 02:02'
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
- [ ] #1 While a sync of the source is pending, the page refreshes its data on its own at a short interval
- [ ] #2 Refreshing stops once the sync has finished and the page shows the new state
- [ ] #3 Without JavaScript the page still works as today
- [ ] #4 The message no longer asks for a reload where the page refreshes by itself
<!-- AC:END -->
