---
id: TASK-278
title: >-
  Management area: compute source overlaps once per request, grouped by
  repository
status: To Do
assignee: []
created_date: '2026-11-06 15:57'
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
- [ ] #1 Overlaps are found by grouping sources by `repositoryKey` first, and computed at most once per request
- [ ] #2 Dead links are counted with `count(*)`
- [ ] #3 `dashboard()` looks up per-source counts by ID (no `find` per row) and returns only what the dashboard shows
- [ ] #4 The source page load returns only the parts the current tab shows
- [ ] #5 Checked by hand with `make agent-many-sources` that management pages stay responsive
<!-- AC:END -->
