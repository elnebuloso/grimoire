---
id: TASK-205
title: Deleting a large source blocks the server for seconds
status: To Do
assignee: []
created_date: '2026-10-31 01:36'
labels:
  - admin
  - sync
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
- [ ] #1 Deleting a source removes its snippets, search entries, pages and links in short transactions, so no single write transaction grows with the size of the source
- [ ] #2 After the delete no row of the source is left in `pages`, `snippets`, `snippets_fts`, `links`, `sync_runs` or `api_key_sources`
- [ ] #3 The batched deletion shares its code with the stale-page cleanup of `replaceSourceIndex` instead of a second copy
- [ ] #4 A test in `app/src/lib/server/db/sources.spec.ts` or `app/src/lib/server/admin/sources.spec.ts` deletes a source spanning several batches and checks that nothing remains
<!-- AC:END -->
