---
id: TASK-77
title: Measure server-thread blocking while the sync worker holds the write lock
status: Done
assignee:
  - '@claude'
created_date: '2026-10-30 00:14'
updated_date: '2026-10-30 01:26'
labels:
  - sync
milestone: m-0
dependencies: []
references:
  - app/src/lib/server/db/sources.ts
  - app/src/lib/server/sync/sync.ts
priority: low
type: spike
ordinal: 139000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Found by a code review on 2026-10-30; a risk, not measured.

The sync worker writes a whole source in one `BEGIN IMMEDIATE` transaction (`app/src/lib/server/db/sources.ts:127`). Meanwhile up to four checks run in parallel on the server thread (`app/src/lib/server/sync/queue.ts:26`), each ending with a write (`clearSyncError`, `recordCheck` in `app/src/lib/server/sync/sync.ts:67,100`); logins and saves write too.

The server connection waits on the lock synchronously for up to 5 s (`busy_timeout`, `app/src/lib/server/db/migrate.ts:30,39`), stalling every request meanwhile; after 5 s the write throws `SQLITE_BUSY`. In `syncSource` that throw escapes the `finally`, so `last_checked_at` is not recorded and the source is due again on the next tick.

Parsing was deliberately moved before the lock, so the transaction may stay short. Measure it on a large documentation set; if it reaches seconds, write in batches or move bookkeeping writes after the sync lane.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 The duration of the index write transaction is measured on a large documentation set and recorded in the task notes
- [x] #2 If it can exceed about 1 s, a follow-up is agreed with the user; otherwise the task closes with the measurement
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
Decided with the user after the measurement: fix it now.
1. Migration 0012: sources.index_generation, pages.generation with UNIQUE (source_id, generation, file), index links(page_id), view live_pages (pages of the source's current generation).
2. replaceSourceIndex writes pages, snippets, search entries and links of the next generation in transactions of at most 500 snippets or links, switches the source to it with one UPDATE, then deletes the other generations 50 pages per transaction. Leftovers of an interrupted sync are deleted before writing.
3. Every reader (search, read, index, llms.txt, stats, source status) reads live_pages instead of pages.
4. Tests: sources.spec (batches, switch, interrupted write), migrate.spec (existing index stays live); benchmark again.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Measured 2026-10-30 on the dev machine (WSL2, 4 cores, Node 24.22.1) with a synthetic source: pages of 8 sections with about 430 words each, a link and a code block per section, so 17 snippets and 8 links per page. replaceSourceIndex on a file database in WAL mode; the time between BEGIN IMMEDIATE and COMMIT (the write lock held):

- 100 pages, 1,700 snippets: first write 198 ms, replace 232 ms
- 300 pages, 5,100 snippets: first write 595 ms, replace 720 ms

About 0.14 ms per snippet, linear: about 1 s at roughly 7,000 snippets, about 5 s (the server connection's busy_timeout) at roughly 35,000 snippets. The inserts themselves (pages, snippets, FTS) take about a third of it, the COMMIT the rest.

Not in the lock but easy to mistake for it: splitCode (Markdown parsing for the FTS columns) runs inside replaceSourceIndex before BEGIN and took about 90% of its total time (2.1 s of 2.1 s for 100 pages including the lock). It runs in the worker thread, so it blocks neither the lock nor the server.

So: for sources up to a few hundred pages the lock stays well under 1 s; very large sources (thousands of long pages) can hold it for seconds and, beyond about 35,000 snippets, make server-thread writes fail with SQLITE_BUSY.

Decision: the user chose to fix it right away rather than a follow-up task.

After the fix, same benchmark, 300 pages / 5,100 snippets / 2,400 links: 66 transactions, longest write lock 112 ms (before: one transaction of 720 ms). The longest lock no longer grows with the size of the source; its bound is the batch size (500 snippets or links, 50 pages per delete). The total write time stays the same.

Checked in the agent environment: after a reset both sources synced to generation 1; a forced re-sync switched to generation 2 and left no stale pages (7 pages, 7 live); read answers as before. Agent environment reset afterwards.

The server's own bookkeeping writes (recordCheck, clearSyncError) stay where they are: they now wait for one batch at most.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Measured, then fixed with the user's go-ahead. A sync held the write lock for its whole index write, about 0.14 ms per snippet: 0.7 s for 5,100 snippets, and seconds (up to SQLITE_BUSY on the server) for very large sources. The index of a source is now written in short transactions under the next generation (migration 0012: generations, view live_pages, index links(page_id)), goes live with one update of the source, and the old generation is deleted in batches afterwards. Readers use live_pages, so they still see either the old or the new index. The longest lock is now about 110 ms whatever the size of the source. Verified by new tests (batching, the switch, an interrupted write keeping the old index live and being cleaned up), a migration test, the benchmark, a re-sync in the agent environment, make lint, make test (487 passed) and make e2e (15 passed).
<!-- SECTION:FINAL_SUMMARY:END -->
