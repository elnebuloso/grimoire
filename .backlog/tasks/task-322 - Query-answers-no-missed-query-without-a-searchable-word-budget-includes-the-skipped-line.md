---
id: TASK-322
title: >-
  Query answers: no missed query without a searchable word, budget includes the
  skipped line
status: Done
assignee:
  - '@claude'
created_date: '2026-11-06 20:52'
updated_date: '2026-11-06 21:33'
labels:
  - agent-api
  - search
dependencies: []
references:
  - app/src/lib/server/search/query.ts
  - app/src/lib/server/agent/operations.ts
priority: low
type: bug
ordinal: 384000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Two small faults in agent query answers:

1. Missed queries without a search. A keyed `query` of `???` or `--` has no word matching `[\p{L}\p{N}_]+`, so `toMatchExpression` in `app/src/lib/server/search/query.ts` yields an empty MATCH, no search runs, the result has `missed: true`, and `agentQuery` in `app/src/lib/server/agent/operations.ts` records the non-empty question in `missed_queries`. Admins see noise on `/manage/missed-queries`. (TASK-139 already stopped recording whitespace-only questions.)
2. Token budget overrun. `packIntoBudget` in `query.ts` packs hits into the caller's `tokens` budget but does not count the "Did not fit: <IDs>" line it appends. With `tokens=1` and 20 hits, all are skipped and the answer is that line alone, roughly 150–300 tokens against a budget of 1. No spec checks that the whole answer stays within the budget.

Suggested fix: record a missed query only when the question contains a letter, digit or underscore (or let the search report that it had no terms); subtract the estimate of the skipped line before packing, or document the budget as covering hits only (`docs/handbook/agents.md`, server instructions `app/src/lib/server/agent/instructions.md`).

Found by a whole-repo audit on 2026-11-06 (commit 601c588 plus six local refactor commits).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 A keyed query without any letter or digit is not recorded as a missed query
- [x] #2 The estimated tokens of an answer, the skipped-IDs line included, do not exceed the requested budget, or the handbook and agent instructions state that the budget covers hits only
- [x] #3 Specs cover both
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Spec: keyed queries of `???` and `-- !` are not recorded as missed
2. query.ts exports hasSearchTerms with the same word pattern the search uses; agentQuery records only when it is true
3. Budget: documented, not enforced. With tokens=1 the skipped-IDs line alone exceeds the budget, and dropping it would take the IDs from the agent; handbook agents.md, the agent instructions and their copy in docs/ARCHITECTURE.md say the line comes on top
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
- The extended spec failed before and passes after; operations, query, agent-api and agent specs pass.
- make handbook passes.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
A keyed query without any letter, digit or underscore is no longer recorded as a missed query, since no search ran; the check uses the search's own word pattern. The token budget stays a budget for the hits: the handbook and the agent instructions now say that the "Did not fit:" line naming the skipped IDs comes on top, because for small budgets that line alone cannot fit. Covered by the missed-query spec in operations.spec.ts.
<!-- SECTION:FINAL_SUMMARY:END -->
