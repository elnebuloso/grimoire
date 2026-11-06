---
id: TASK-316
title: >-
  Queries without results: search and sort over all stored questions, not the
  newest 200
status: Done
assignee:
  - '@claude'
created_date: '2026-11-06 20:51'
updated_date: '2026-11-06 21:04'
labels:
  - admin
  - agent-api
dependencies: []
references:
  - app/src/lib/server/missed-queries.ts
  - app/src/routes/manage/missed-queries/+page.server.ts
priority: medium
type: bug
ordinal: 378000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
`listMissedQueries` in `app/src/lib/server/missed-queries.ts` groups the stored questions and applies `LIMIT ?` with `MAX_LISTED = 200` before the page `/manage/missed-queries` (`app/src/routes/manage/missed-queries/+page.server.ts`) searches, sorts and pages them with `listPage` (100 rows per page). Up to `MAX_ENTRIES = 10_000` rows are kept for `KEEP_DAYS = 30`.

Case: a question last asked before the newest 200 groups cannot be found by the page's search; sorting by "Times asked" can hide the most-asked question; page 3 never exists. The page promises the questions of the last 30 days.

Suggested fix: drop the `LIMIT` and `MAX_LISTED`; the table is already capped at 10k rows and the page splits the list into pages itself.

Found by a whole-repo audit on 2026-11-06 (commit 601c588 plus six local refactor commits).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 The list contains every group of stored questions, also with more than 200 groups
- [x] #2 Searching for an older question finds it, and sorting by times asked considers all groups
- [x] #3 A spec covers more than 200 groups
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Specs: listMissedQueries returns 250 groups; the page finds an older question by search and sorts it first by times asked among 251 groups
2. Drop LIMIT and MAX_LISTED in listMissedQueries
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
- The route spec failed against the old code (search found nothing) and passes after; missed-queries.spec.ts and the route spec pass (7 tests).
- The table stays capped at 10,000 rows and 30 days, so the unpaged query is bounded.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
The list of queries without results now holds every stored group instead of the newest 200, so the page's search, sort and paging work over all questions of the last 30 days. The table is still capped at 10,000 rows. A spec of listMissedQueries and a route spec with 251 groups cover it; the route spec failed before.
<!-- SECTION:FINAL_SUMMARY:END -->
