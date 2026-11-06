---
id: TASK-317
title: 'Source Status tab: load the totals without the whole page list'
status: Done
assignee:
  - '@claude'
created_date: '2026-11-06 20:51'
updated_date: '2026-11-06 21:06'
labels:
  - admin
dependencies: []
references:
  - 'app/src/routes/manage/sources/[id]/[[tab=tab]]/+page.server.ts'
  - app/src/lib/server/admin/status.ts
priority: medium
type: enhancement
ordinal: 379000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The load of `app/src/routes/manage/sources/[id]/[[tab=tab]]/+page.server.ts` calls `sourceStatus` with `pages: tab === 'status' || tab === 'pages'`. For the Status tab, `sourceStatus` in `app/src/lib/server/admin/status.ts` runs the per-page `GROUP BY` over `live_pages` and `snippets` (with `sum(snippets.tokens)`, reading every snippet row) and returns the whole `pages` array, which goes to the browser. `StatusTab.svelte` reads only `status.totals`; only `PagesTab.svelte` uses `status.pages`.

Case: for a source with 5,000 pages, every Status view, every refresh after an action and every refresh when a sync ends runs the full grouping and ships 5,000 `PageSummary` rows that are never shown.

Suggested fix: request pages only for `tab === 'pages'` and compute the Status totals with one aggregate query (count of pages, count of snippets, sum of tokens), or take them from the source statistics.

Found by a whole-repo audit on 2026-11-06 (commit 601c588 plus six local refactor commits).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 The Status tab's data contains the totals but no page list
- [x] #2 The totals shown on the Status tab equal those of today for the same source
- [x] #3 The Pages tab still lists every page
- [x] #4 The route spec covers what the Status tab loads
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Specs: sourceStatus without pages still returns the totals; the Status tab load carries the totals and an empty page list, the Pages tab the list
2. sourceStatus takes the totals from one aggregate query over live_pages and snippets
3. The source page load asks for pages only on the Pages tab
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
- Both specs failed before and pass after; status.spec.ts and sources.spec.ts pass (47 tests).
- Only PagesTab.svelte reads status.pages; the Status tab reads only totals.
- The aggregate still sums the tokens of the source's snippets, but no longer groups per page nor ships one row per page to the browser.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
The source Status tab no longer loads the whole page list: the totals come from one aggregate query, and the page list is loaded on the Pages tab only, so a source with thousands of pages no longer ships them on every Status view and refresh. Totals are unchanged; specs for sourceStatus and the route cover both tabs.
<!-- SECTION:FINAL_SUMMARY:END -->
