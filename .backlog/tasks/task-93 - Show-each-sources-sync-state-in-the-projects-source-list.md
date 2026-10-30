---
id: TASK-93
title: Show each source's sync state in the project's source list
status: Done
assignee:
  - '@claude'
created_date: '2026-10-30 02:00'
updated_date: '2026-10-30 02:32'
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
- [x] #1 Each source in the list shows its last sync time or "never", and marks a sync error and the number of warnings
- [x] #2 The state comes from the same data the dashboard's attention list uses, not from a second calculation
- [x] #3 Tests cover a source with an error, with warnings, never synced and healthy
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. status.ts: sourceHealth(db, projectId?) returns, per source, last sync time, never-synced, error and warnings — one query; dashboard builds its attention list by filtering it instead of its own query.
2. Project page load adds the health of its sources; the list shows last sync (or never), the error and the warning count per source.
3. Tests: status.spec for sourceHealth (error, warnings, never synced, healthy, project filter) and the dashboard keeps its behaviour; projects.spec for the load.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
sourceHealth(db, projectId?) in admin/status.ts is the one query for the sync state of sources; the dashboard's attention list is sourceHealth(db).filter(needsAttention), and the project page joins it to its sources by id. Warning counts use new messages without the trailing colon of the dashboard's. Verified: status.spec (all four states via the fixture: error, warnings, healthy, never synced; attention equals filtered health), projects.spec (load carries health per source), make lint, server tests 508 passed; by hand in the agent environment on both fixture projects.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
The source list on a project page now shows each source's last sync time or 'never synced', its sync error and its warning count. The state comes from sourceHealth, which the dashboard's 'Needs attention' list now filters instead of running its own query. Handbook updated. Verified with unit tests, make lint and in the agent environment.
<!-- SECTION:FINAL_SUMMARY:END -->
