---
id: TASK-136
title: Delete old index pages in batches weighted by snippets
status: Done
assignee:
  - '@claude'
created_date: '2026-10-30 10:55'
updated_date: '2026-10-30 11:12'
labels:
  - sync
milestone: m-0
dependencies: []
priority: medium
type: bug
ordinal: 198000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Found in the second whole-project code review of 2026-10-30. After an index swap, `deleteStalePages` in `app/src/lib/server/db/sources.ts` (around lines 206-215) deletes the pages of the old generation 50 per transaction (`PAGES_PER_DELETE`), whatever their size; each deleted snippet also deletes its FTS row. Inserts are batched by weight at 500 snippets (`SNIPPETS_PER_BATCH`), with the comment giving about 0.15 ms of write lock per snippet. The include budget allows a page of 1,000,000 characters, about 1,250 snippets of 800 tokens, so 50 such pages make one transaction of about 62,000 snippets, about 9 s of write lock by that figure. Meanwhile every write on the server connection waits synchronously (`last_used_at` of an API key, `recordCheck`, a missed query, a login session); the busy timeout is 5 s (`app/src/lib/server/db/migrate.ts` around line 31), so those writes fail with `SQLITE_BUSY` and agent requests answer 500. This is an estimate from the code figure, not a measurement; a normal source with about ten snippets per page is far below it.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 No delete transaction of an old index removes more snippets than an insert batch writes (`SNIPPETS_PER_BATCH`), whatever the page sizes
- [x] #2 After a swap, no pages, snippets, FTS rows or links of the old generation remain
- [x] #3 A test with a few pages of many snippets each checks the old generation is fully gone and the delete ran in snippet-bounded batches
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. deleteStalePages deletes the snippets of stale pages first, at most snippetsPerBatch per transaction (the same weight as inserts), then the now empty pages with their links as before.
2. Test: a two-page old index of 10 snippets replaced with snippetsPerBatch 3; snippet count at every COMMIT shows deletes of 3, 3, 3, 1 and nothing of the old generation left.
<!-- SECTION:PLAN:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Old index generations are now deleted snippets first, in transactions of at most SNIPPETS_PER_BATCH (500) snippets with their FTS rows, then the empty pages and their links 50 at a time. Before, 50 pages went in one transaction whatever their size, which for pages near the include budget could hold the write lock longer than the 5 s busy timeout (an estimate from the code figure, not measured). New sources.spec test counts snippets at every COMMIT: the old code deleted 10 in one transaction, the new code 3, 3, 3, 1 with snippetsPerBatch 3, and no pages, snippets, FTS rows or links of the old generation remain. 101 db and sync specs pass.
<!-- SECTION:FINAL_SUMMARY:END -->
