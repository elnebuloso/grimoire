---
id: TASK-389
title: 'Search: name each skipped ID once in ''Did not fit'''
status: Done
assignee:
  - '@claude'
created_date: '2026-11-08 16:45'
updated_date: '2026-11-08 18:15'
labels:
  - search
dependencies: []
priority: low
type: bug
ordinal: 451000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
`packIntoBudget` in `app/src/lib/server/search/query.ts:369-386` adds the grimoire ID of every hit that does not fit the token budget to the closing line `Did not fit: …` (line 378), without checking for repeats. A long section is split into parts (`Rollback (1/2)`, `Rollback (2/2)`) that share one anchor and therefore one ID.

Case: two parts of `src/page#install` both match and both do not fit. The answer ends with `Did not fit: src/page#install, src/page#install`, which costs the agent tokens and tells it nothing more.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Each ID appears once in the Did not fit line, in the order of the first skipped hit
- [x] #2 A spec in query.spec.ts with two skipped parts of one section
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. packIntoBudget collects skipped IDs in a Set, which keeps the order of the first skipped hit.
2. Spec in query.spec.ts with two skipped parts of one section.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
make benchmark not run: the benchmark ranks the packed hits with an unlimited budget and never reads the skipped list, so nothing it measures changes. Spec fails before, passes after; query.spec.ts 19 passed.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
The 'Did not fit' line names each grimoire ID once, in the order of its first skipped hit; parts of one long section no longer repeat it. Spec in query.spec.ts.
<!-- SECTION:FINAL_SUMMARY:END -->
