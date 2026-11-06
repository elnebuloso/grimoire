---
id: TASK-317
title: 'Source Status tab: load the totals without the whole page list'
status: To Do
assignee: []
created_date: '2026-11-06 20:51'
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
- [ ] #1 The Status tab's data contains the totals but no page list
- [ ] #2 The totals shown on the Status tab equal those of today for the same source
- [ ] #3 The Pages tab still lists every page
- [ ] #4 The route spec covers what the Status tab loads
<!-- AC:END -->
