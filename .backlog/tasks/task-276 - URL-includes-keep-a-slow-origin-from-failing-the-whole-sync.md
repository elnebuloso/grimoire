---
id: TASK-276
title: 'URL includes: keep a slow origin from failing the whole sync'
status: Done
assignee:
  - '@claude'
created_date: '2026-11-06 15:56'
updated_date: '2026-11-06 18:13'
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
- [x] #1 A hanging origin produces warnings on its includes and the sync still completes within the indexing deadline
- [x] #2 URL fetches of a round run in parallel or share a total deadline below the indexing deadline
- [x] #3 A spec with a slow local server covers it
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Specs first: ten includes on a local server that never answers (fetchInclude with a short timeout) finish in about one timeout with ten warnings; content that keeps naming new URLs stops at a shared deadline with a warning
2. prepareCheckout fetches the URLs of a round at once and gives all URL fetches of a sync one deadline (2 minutes, an option for tests); past it, includes are reported as not fetched
3. Handbook writing.md names the 2-minute limit
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
- Both specs failed before the change (3.0 s and 5.0 s) and pass after.
- 2 minutes keeps URL includes well below the 10-minute indexing deadline; a hanging origin now costs at most one 10-second timeout per round, and the rounds together at most 2 minutes.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
URL includes of a round are fetched in parallel, and all URL fetches of a sync share a 2-minute deadline; an origin that hangs now produces warnings on its includes and the sync completes instead of hitting the 10-minute indexing deadline. Specs with a non-answering local server and a never-ending chain of includes failed before and pass after; handbook updated.
<!-- SECTION:FINAL_SUMMARY:END -->
