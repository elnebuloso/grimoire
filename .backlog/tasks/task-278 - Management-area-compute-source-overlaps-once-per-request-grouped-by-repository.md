---
id: TASK-278
title: >-
  Management area: compute source overlaps once per request, grouped by
  repository
status: Done
assignee:
  - '@claude'
created_date: '2026-11-06 15:57'
updated_date: '2026-11-06 17:49'
labels:
  - admin
dependencies: []
priority: medium
type: enhancement
ordinal: 340000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
`managementCounts` in `app/src/lib/server/admin/status.ts` runs in the `/manage` layout load (`app/src/routes/manage/+layout.server.ts`), so on every management page and every `invalidateAll` after a form action. It calls `findOverlaps(listSources(db))`, which compares all n·(n−1)/2 pairs of sources (`admin/duplicates.ts`), parsing two URLs in `repositoryKey` per pair, and reads every dead link row just to take `.length`. The dashboard (`dashboard()`), the source page (`overlapsOf()`) and the duplicates page then do the same work again. `dashboard()` also searches the whole source list with `sources.find` for every health row, and returns a `sources` field the dashboard load drops (only `status.spec.ts` reads it).

The source page load (`app/src/routes/manage/sources/[id]/[[tab=tab]]/+page.server.ts`) builds the full `sourceStatus` (every page with snippet sums, the whole sync history, every dead link) for every tab, Settings included, and again after each save and after the sync-pending poll.

At 500 sources (`make agent-many-sources`) that is about 125,000 comparisons per `findOverlaps` call, two calls per view. Not measured.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Overlaps are found by grouping sources by `repositoryKey` first, and computed at most once per request
- [x] #2 Dead links are counted with `count(*)`
- [x] #3 `dashboard()` looks up per-source counts by ID (no `find` per row) and returns only what the dashboard shows
- [x] #4 The source page load returns only the parts the current tab shows
- [x] #5 Checked by hand with `make agent-many-sources` that management pages stay responsive
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. findOverlaps groups sources by repositoryKey and compares pairs within a group only, order kept
2. sourceOverlaps(db, request) caches the pairs per request (WeakMap on locals); layout counts, dashboard, source page and duplicates page use it
3. Dead links counted with count(*)
4. dashboard looks up dead links per source in a Map and returns totals and attention only
5. The source page load asks sourceStatus only for the parts its tab shows (pages on status/pages, history on history, dead links and overlaps on status)
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
- Checked by hand with make agent-many-sources (500 more sources): data loads of /manage 50–309 ms, /manage/sources 56–212 ms, /manage/duplicates 38–256 ms, source status 40–76 ms, settings 15–32 ms, history 20–23 ms (three runs each, first run slowest). Agent environment reset afterwards.
- The dashboard's unused 'sources' field and its spec are gone.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Source overlaps are found by grouping sources by repository first and computed at most once per request (cached on locals) for the layout counts, dashboard, source page and duplicates page. Dead links are counted with count(*), the dashboard looks up per-source counts by ID and returns only what it shows, and the source page loads only the parts its tab needs. Specs green; management pages stay responsive with 500 extra sources.
<!-- SECTION:FINAL_SUMMARY:END -->
