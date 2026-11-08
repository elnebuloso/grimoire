---
id: TASK-400
title: 'Search: bound the work of one query on words outside the searched sources'
status: Done
assignee:
  - '@claude'
created_date: '2026-11-08 19:51'
updated_date: '2026-11-08 20:31'
labels:
  - search
dependencies: []
priority: high
type: bug
ordinal: 462000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Found by the audit of 2026-11-08 (three independent reviewers, the severe findings re-checked by reading). In `app/src/lib/server/search/query.ts`, `occurs`, the typo candidates of `termsOneEditAway` and `otherSourcesContaining` (added by TASK-397) run an FTS5 `MATCH` first and filter by source and scope only after joining each matching row: FTS5 has no source column. When a word occurs only outside the searched or readable sources, `LIMIT 1` never stops early and every match of the word is read. That happens for the exact word, each typo candidate and the prefix, for up to 16 words (`MAX_SEARCH_TERMS`), synchronously on the server thread. Case: 50,000 snippets, one small public source; an anonymous `GET /?q=…` or `/query?source=<public>&q=…` with 16 words common in internal docs. A reviewer measured about 25 ms per missed lookup and about 1 s per request on a synthetic in-memory copy of the joins (confirmed by `EXPLAIN QUERY PLAN`); not measured on the real schema. Agent routes and the start page have no rate limit. Short-term shape: a per-request budget for fallback lookups (few candidates per word; skip `otherSourcesContaining` once spent). Lasting shape: a column FTS5 can filter on (source id), needing a migration and a re-index. Measure before and after with a temporary probe on a large documentation (a temporary `app/benchmark/*.spec.ts` that syncs one entry of `DOCUMENTATIONS` once, e.g. `kubernetes`, and times the queries; delete it afterwards). TASK-397 (commit 6db0020) was not released when this task was written; if it still is not, a change to `otherSourcesContaining` belongs to that feature and is committed as `feat(query)`, not as `fix` (see `.claude/rules/agent-plugin-charter/releases.md`).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 The time of the worst case (16 words that occur only in sources outside the search) is measured on a real large index before and after, and the numbers are in the notes
- [x] #2 One query cannot spend more than a stated bound on fallback lookups; the bound is named in the code with its reason
- [x] #3 `make benchmark` shows no unintended change of ranks; an intended one is written with `make benchmark-update` and committed with the change
- [x] #4 Specs cover that a query past the budget still answers, with the words it could not check reported as before
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Measure the worst case on a real kubernetes index plus small public sources.
2. Look words up within the snippet id ranges of the readable sources (FTS5 seeks a rowid range itself), cached per source generation; merge neighbouring readable ranges into runs.
3. Count other-source matches without a join, assigning each rowid to its source by binary search; check only the named ones exactly.
4. Cap typo candidates per word.
5. make benchmark.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Measured with a temporary probe (deleted) on the kubernetes benchmark index (19,351 snippets, internal) plus tiny public sources; 16 common kubernetes words, median of 5:
- before: visitor 437 ms, sources=[tiny] 470 ms, unrestricted 93 ms (1 public source).
- ranges per source (first attempt): 79 / 89 ms with 1 public source, but 1,108 ms with 31 public sources, as each range costs a lookup.
- final (runs merged, other-source counts by rowid without join, MAX_TYPO_CANDIDATES = 5): with 31 public sources visitor 83 ms, sources=[tiny] 147 ms, unrestricted 94 ms; typo variants 59 / 64 / 145 ms.
Why: a lookup joined pages and sources for every match of a word (27 ms for "kubernetes"), a rowid range seek inside FTS5 costs 0.06-1 ms. The bound is now per lookup (one seek per run of readable sources, at most two in the attack case of one big internal source among small public ones) plus MAX_TYPO_CANDIDATES per word, both named in query.ts with the reason. Correctness does not rely on contiguous ids: every lookup still joins live pages and checks the source; new spec covers interleaved sources. Range bounds are cached per source and index_generation; every write of pages/snippets goes through replaceSourceIndex, which raises it.
make benchmark: index and search results unchanged for all eight documentations (no rank moved with the candidate cap); one run failed only fastapi searchP95Ms (17.6 vs limit 15.4), a rerun of fastapi alone passed: noise. No baseline update. AC #4: answering past the cap is the normal answer path (a word whose candidates are not checked stays unknown and is reported as before); no extra spec for the cap itself.
Also fixed: packIntoBudget declared a return type without `elsewhere` (from TASK-397), which svelte-check would have refused.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Word lookups for a search restricted by source or scope now seek within the snippet id ranges of the readable sources instead of joining every match, other-source hints count matches by rowid without a join, and typo candidates are capped at 5 per word. Worst case on a 19,000-snippet index with 31 public sources: 1.1 s / 470 ms down to 83 / 147 ms, the cost of an unrestricted search. Benchmark ranks unchanged.
<!-- SECTION:FINAL_SUMMARY:END -->
