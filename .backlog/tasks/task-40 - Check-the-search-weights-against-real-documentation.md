---
id: TASK-40
title: Check the search weights against real documentation
status: To Do
assignee: []
created_date: '2026-10-29T00:47:00Z'
labels:
  - search
milestone: m-0
dependencies: []
priority: low
type: spike
ordinal: 102000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
`query` ranks with `bm25(snippets_fts, 10, 1, 0.25)` in `app/src/lib/server/search/query.ts`: title path 10, text 1, code 0.25. These are starting values, never checked against a real documentation set.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Typical agent questions against a real documentation set are run and their top hits judged
- [ ] #2 The weights are kept or changed based on that, with the reason recorded in the task
<!-- AC:END -->
