---
id: TASK-93
title: Show each source's sync state in the project's source list
status: To Do
assignee: []
created_date: '2026-10-30 02:00'
updated_date: '2026-10-30 02:02'
labels:
  - admin
  - sync
milestone: m-0
dependencies: []
references:
  - 'app/src/routes/manage/projects/[id]/+page.svelte'
priority: medium
type: enhancement
ordinal: 155000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The project page lists sources with Git URL, branch and path only. Whether one of them fails, has warnings or never synced is visible only after opening each source, although the dashboard already computes this state for its attention list.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Each source in the list shows its last sync time or "never", and marks a sync error and the number of warnings
- [ ] #2 The state comes from the same data the dashboard's attention list uses, not from a second calculation
- [ ] #3 Tests cover a source with an error, with warnings, never synced and healthy
<!-- AC:END -->
