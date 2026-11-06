---
id: TASK-311
title: >-
  Source statistics: stop recounting all snippets on every visit to the start
  page
status: Done
assignee:
  - '@claude'
created_date: '2026-11-06 20:51'
updated_date: '2026-11-06 21:24'
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
- [x] #1 Loading the start page twice without a sync in between computes the per-source counts only once
- [x] #2 After a sync changes a source's index, the next load shows its new counts
- [x] #3 Counts shown on `/`, `/manage/sources` and the dashboard stay identical to the current results (existing specs pass)
- [x] #4 A spec covers the refresh after a re-index
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Spec: counts stay while rows change without a new index generation, and follow once the generation is raised
2. sourceStats reads the source rows with index_generation and takes pages, snippets, tokens and dead links from a cache per database and source, counted again only when the generation differs; entries of deleted sources are dropped on each call
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
- links.dead is written only together with a new index (grep: no UPDATE of links), and every new index raises index_generation, so the generation is a complete key.
- The cache is a WeakMap per DatabaseSync, so specs with their own in-memory databases never share figures.
- The spec failed before and passes after; the specs of every caller (start page, /manage/sources, dashboard, management routes) pass (86 tests). Not measured again on a large index: the uncached path is the same query as before, the cached path reads only the sources table.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
The per-source page, snippet, token and dead-link counts of the start page, /manage/sources and the dashboard are now cached per source and index generation, so they are counted again only after a sync wrote a new index instead of on every visit and every list change. The figures shown are unchanged. A spec in stats.spec.ts covers that the counts follow a new generation; the callers' specs pass.
<!-- SECTION:FINAL_SUMMARY:END -->
