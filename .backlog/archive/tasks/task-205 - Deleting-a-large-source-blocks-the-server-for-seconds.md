---
id: TASK-205
title: Deleting a large source blocks the server for seconds
status: Done
assignee:
  - '@claude'
created_date: '2026-10-31 01:36'
updated_date: '2026-10-31 02:01'
labels:
  - admin
  - sync
milestone: m-1
dependencies: []
references:
  - app/src/lib/server/admin/sources.ts
  - app/src/lib/server/db/sources.ts
priority: low
type: enhancement
ordinal: 267000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
`deleteSource` in `app/src/lib/server/admin/sources.ts` (around line 352) removes a source with a single `DELETE FROM sources`; pages, snippets, links and (via the `snippets_fts_delete` trigger) search entries go by `ON DELETE CASCADE` in that one statement. `node:sqlite` is synchronous, so the whole server answers no request while it runs, and it holds the write lock the indexing child process waits on.

Measured in the agent shell (scratch script against `0001-initial.sql`): 2.0 s for a source with 2000 pages and 50 000 snippets. `replaceSourceIndex` in `app/src/lib/server/db/sources.ts` already avoids this for re-indexing by deleting in short batches (`deleteStalePages`, `SNIPPETS_PER_BATCH`).

Found in the code audit of 2026-10-31.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Deleting a source removes its snippets, search entries, pages and links in short transactions, so no single write transaction grows with the size of the source
- [x] #2 After the delete no row of the source is left in `pages`, `snippets`, `snippets_fts`, `links`, `sync_runs` or `api_key_sources`
- [x] #3 The batched deletion shares its code with the stale-page cleanup of `replaceSourceIndex` instead of a second copy
- [x] #4 A test in `app/src/lib/server/db/sources.spec.ts` or `app/src/lib/server/admin/sources.spec.ts` deletes a source spanning several batches and checks that nothing remains
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. db/sources.ts: replace the loops of deleteStalePages with deletePageBatch(db, sourceId, which, snippetsPerBatch), which deletes one batch of snippets (with their search entries) or, once none are left, one batch of pages (with their links), and says whether it deleted anything.
2. deleteStalePages loops over it as before; a new async deleteSource in db/sources.ts loops over it for all pages of the source, yields to other requests between batches (node:sqlite is synchronous, so batches alone would still block the server), then deletes the source row (sync runs and key selections go by cascade).
3. Move deleteSource from admin/sources.ts to db/sources.ts; the delete action awaits it.
4. Test in db/sources.spec.ts: a source spanning several batches is deleted in transactions of at most one batch, and nothing of it remains in pages, snippets, snippets_fts, links, sync_runs, api_key_sources.
5. Measure again with the 50 000 snippet script.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Measured with the scratch script (2000 pages, 50 000 snippets): before, one DELETE blocked the server for 2.0 s; now the deletion takes 3.4 s in total but the event loop never stalls longer than 173 ms, and no row of the source remains. Delete action checked in the agent environment on the synced platform-docs source: redirect to /manage, no pages left. The new spec test failed to import before deleteSource existed in db/sources.ts.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Deleting a source now removes its index in short transactions and yields to other requests between them, then deletes the source row (sync runs and key selections by cascade). deletePageBatch in db/sources.ts deletes one batch of snippets or pages and is shared by the stale-page cleanup of replaceSourceIndex and the new async deleteSource, which moved from admin/sources.ts to db/sources.ts; the delete action awaits it. Test in db/sources.spec.ts: deletion of a source spanning several batches commits at most 3 snippets per transaction and leaves nothing in sources, pages, snippets, snippets_fts, links, sync_runs or api_key_sources. make test --changed green (236 tests).
<!-- SECTION:FINAL_SUMMARY:END -->
