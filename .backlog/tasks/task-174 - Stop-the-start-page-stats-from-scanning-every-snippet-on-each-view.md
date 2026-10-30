---
id: TASK-174
title: Stop the start page stats from scanning every snippet on each view
status: To Do
assignee: []
created_date: '2026-10-30 16:13'
labels:
  - search
milestone: m-0
dependencies: []
priority: low
type: enhancement
ordinal: 236000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The stats on `/` (`app/src/lib/server/stats.ts`, loaded in `app/src/routes/+page.server.ts`) use correlated `count`/`sum` subqueries over `snippets JOIN live_pages` on every view, synchronous on the server thread. Measured with a standalone script on the real schema and 200,000 snippets: about 40 ms per view. `/` is open without a login and also hosts the anonymous query form, so every view and every submit pays this. `replaceSourceIndex` already knows the counts when it swaps an index in.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Loading `/` does not scan the snippets table
- [ ] #2 The counts shown stay correct after a sync, a failed sync and the deletion of a source
<!-- AC:END -->
