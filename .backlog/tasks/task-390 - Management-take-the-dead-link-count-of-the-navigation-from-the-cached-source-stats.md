---
id: TASK-390
title: >-
  Management: take the dead-link count of the navigation from the cached source
  stats
status: Done
assignee:
  - '@claude'
created_date: '2026-11-08 16:45'
updated_date: '2026-11-08 18:40'
labels:
  - admin
dependencies: []
priority: low
type: enhancement
ordinal: 452000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
`managementCounts` in `app/src/lib/server/admin/status.ts`, called by `app/src/routes/manage/+layout.server.ts:9` on every page of the management area, counts dead links with `count(*) FROM links JOIN live_pages … WHERE dead = 1`. `links.dead` has no index, so every request scans all links. `sourceStats` in `app/src/lib/server/stats.ts` already caches `deadLinks` per source and index generation.

Case: an instance with a few hundred thousand links pays the scan on every click in the management area; estimated tens of milliseconds per page view, not measured.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 The dead-link count of managementCounts comes from sourceStats (sum of deadLinks), with the same result as today
- [x] #2 The existing specs of status.ts pass; a spec covers the count after a sync that changes the dead links
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
managementCounts sums deadLinks of sourceStats, which caches the counts per source and index generation; spec for the count after a new generation.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Same query per source as before, summed; links of a source change only with a new index generation, which invalidates the cache. Existing status specs and the new one pass (make test --changed: 56 passed). Timing not measured.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
The dead-link count in the management navigation now comes from the cached source stats instead of a scan of all links on every page of the area. Same result; spec covers the count after a sync changes the dead links.
<!-- SECTION:FINAL_SUMMARY:END -->
