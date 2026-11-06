---
id: TASK-316
title: >-
  Queries without results: search and sort over all stored questions, not the
  newest 200
status: To Do
assignee: []
created_date: '2026-11-06 20:51'
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
- [ ] #1 The list contains every group of stored questions, also with more than 200 groups
- [ ] #2 Searching for an older question finds it, and sorting by times asked considers all groups
- [ ] #3 A spec covers more than 200 groups
<!-- AC:END -->
