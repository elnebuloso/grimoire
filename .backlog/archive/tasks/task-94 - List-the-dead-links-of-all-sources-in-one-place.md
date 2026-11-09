---
id: TASK-94
title: List the dead links of all sources in one place
status: Done
assignee:
  - '@claude'
created_date: '2026-10-30 02:01'
updated_date: '2026-10-30 02:35'
labels:
  - admin
milestone: m-0
dependencies: []
priority: low
type: enhancement
ordinal: 156000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The dashboard shows only the total number of dead links. Finding them means opening every source in turn.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 From the dead-link count on the dashboard an admin reaches a list of all dead links, grouped by project and source
- [x] #2 Each entry names file, anchor and target, and links to its source page
- [x] #3 Without dead links the list says so
- [x] #4 Tests cover loading the list
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. status.ts: deadLinks(db, sourceId?) is the one query for dead links, with project and source; sourceStatus uses it for one source.
2. New page /manage/dead-links groups them by project and source, each group linked to its source page, each entry with file, anchor and target; without dead links it says so.
3. The dead-link count on the dashboard links to the page.
4. Tests: status.spec for deadLinks across sources; route spec for the load.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
deadLinks(db, sourceId?) in admin/status.ts is the one dead-link query; sourceStatus uses it for one source. /manage/dead-links groups by source; the dashboard's dead-link figure is a link to it. Verified: status.spec (all sources, one source, sourceStatus unchanged), dead-links.spec (empty, grouping), make lint, server tests 511 passed; by hand in the agent environment: dashboard shows 6, page lists 3 per fixture source with links to the source pages.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
New page listing every dead link, grouped by project and source with links to the source pages, reached from the dead-link figure on the dashboard; without dead links it says so. Source page and the new page share one query. Handbook updated. Verified with unit tests, make lint and in the agent environment.
<!-- SECTION:FINAL_SUMMARY:END -->
