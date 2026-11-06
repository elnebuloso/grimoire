---
id: TASK-276
title: 'URL includes: keep a slow origin from failing the whole sync'
status: To Do
assignee: []
created_date: '2026-11-06 15:56'
labels:
  - sync
dependencies: []
priority: medium
type: bug
ordinal: 338000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
`prepareCheckout` in `app/src/lib/server/sync/index-source.ts` awaits each URL include fetch in turn, and every round resolves the includes of all pages again. A fetch may take up to 10 s, and up to 100 includes are allowed, so an allowed origin that hangs can take about 1,000 s, more than `INDEXING_DEADLINE_MS` (10 minutes, `sync/sync.ts`). The sync then fails as a whole with "indexing took longer than 10 minutes", while the design intends a slow URL to become a warning on that one include. Reasoned from the constants, not run.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 A hanging origin produces warnings on its includes and the sync still completes within the indexing deadline
- [ ] #2 URL fetches of a round run in parallel or share a total deadline below the indexing deadline
- [ ] #3 A spec with a slow local server covers it
<!-- AC:END -->
