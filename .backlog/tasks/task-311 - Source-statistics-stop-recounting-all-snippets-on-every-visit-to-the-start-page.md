---
id: TASK-311
title: >-
  Source statistics: stop recounting all snippets on every visit to the start
  page
status: To Do
assignee: []
created_date: '2026-11-06 20:51'
labels:
  - search
  - admin
dependencies: []
references:
  - app/src/lib/server/stats.ts
  - app/src/routes/+page.server.ts
priority: medium
type: enhancement
ordinal: 373000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
`sourceStats` in `app/src/lib/server/stats.ts` computes per source the page, snippet, token and dead-link counts with four correlated subqueries over all pages, snippets and links (`sum(snippets.tokens)` reads every snippet row). It runs on every load of the public start page (`app/src/routes/+page.server.ts`), of `/manage/sources` (`app/src/routes/manage/sources/+page.server.ts`) and of the dashboard (`app/src/lib/server/admin/status.ts`). These lists keep search, filter, sort and page in the URL, so every list change and every typed search (after 300 ms) reruns the full query.

Measured with the exact query on 50 sources × 400 pages × 50 snippets (1M snippets): about 190 ms per call, synchronously on the single Node thread. About five anonymous hits per second on `/` keep the server busy, and MCP/API requests wait behind them.

The figures change only when a source's index changes, which bumps `index_generation` on `sources`. Suggested fix: keep the figures in memory per source id, keyed by its `index_generation` (and the dead-link basis), recomputing only on a mismatch; no schema change needed. Alternatively store the counts on `sources` when a sync finishes.

Found by a whole-repo audit on 2026-11-06 (commit 601c588 plus six local refactor commits).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Loading the start page twice without a sync in between computes the per-source counts only once
- [ ] #2 After a sync changes a source's index, the next load shows its new counts
- [ ] #3 Counts shown on `/`, `/manage/sources` and the dashboard stay identical to the current results (existing specs pass)
- [ ] #4 A spec covers the refresh after a re-index
<!-- AC:END -->
