---
id: TASK-400
title: 'Search: bound the work of one query on words outside the searched sources'
status: To Do
assignee: []
created_date: '2026-11-08 19:51'
updated_date: '2026-11-08 19:52'
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
- [ ] #1 The time of the worst case (16 words that occur only in sources outside the search) is measured on a real large index before and after, and the numbers are in the notes
- [ ] #2 One query cannot spend more than a stated bound on fallback lookups; the bound is named in the code with its reason
- [ ] #3 `make benchmark` shows no unintended change of ranks; an intended one is written with `make benchmark-update` and committed with the change
- [ ] #4 Specs cover that a query past the budget still answers, with the words it could not check reported as before
<!-- AC:END -->
