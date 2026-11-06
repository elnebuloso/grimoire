---
id: TASK-313
title: >-
  Read path: bookkeeping writes must not stall or fail agent requests during a
  sync
status: To Do
assignee:
  - '@claude'
created_date: '2026-11-06 20:51'
updated_date: '2026-11-06 21:21'
labels:
  - agent-api
dependencies: []
references:
  - app/src/lib/server/api-keys.ts
  - app/src/lib/server/missed-queries.ts
  - app/src/lib/server/db/migrate.ts
priority: medium
type: bug
ordinal: 375000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Read requests write bookkeeping on the server's database connection: `scopeForKey` in `app/src/lib/server/api-keys.ts` updates `last_used_at` and flushes the per-key request counts (`writeRequests`, at most once a minute per key), and `recordMissedQuery` in `app/src/lib/server/missed-queries.ts` inserts missed questions. The connection's busy timeout is `BUSY_TIMEOUT_MS = 5000` (`app/src/lib/server/db/migrate.ts`).

The indexing worker (`app/src/lib/server/sync/index-worker.ts`) replaces a source's index in one write transaction on its own connection. While it holds the write lock, such a bookkeeping write waits up to 5 s inside SQLite's busy handler – synchronously, on the main thread, so all requests stall. If the transaction lasts longer than 5 s, the write throws SQLITE_BUSY (errcode 5) and a pure read answers 500. How long a large re-index holds the lock was not measured; measure it as part of this task.

Suggested fix: run these bookkeeping writes so that a busy database is skipped instead of waited for (e.g. a separate statement path with `PRAGMA busy_timeout = 0`, or catching errcode 5): the request counts already stay in memory until the next write, and a dropped missed query is acceptable.

Found by a whole-repo audit on 2026-11-06 (commit 601c588 plus six local refactor commits).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 While another connection holds the write lock, a keyed read request answers without waiting for the busy timeout and without an error
- [ ] #2 Request counts not written because of a busy database are written by a later request
- [ ] #3 A missed query that cannot be recorded because the database is busy does not fail the query
- [ ] #4 Specs hold the write lock on a second connection and cover both writes
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
- Measured 2026-11-06 (scratchpad script, not committed): replacing a 2,000-page / 20,000-snippet index with `replaceSourceIndex` while a second connection loops `BEGIN IMMEDIATE; COMMIT`: longest wait 134 ms for the first index, 335 ms when the second run also deletes the old index; total 6 s.
- The premise does not hold: the index is written and deleted in short batches (`SNIPPETS_PER_BATCH = 500`, `PAGES_PER_DELETE = 50`), not in one transaction, so the 5 s busy timeout is never reached and no read answers 500. A bookkeeping write waits at most about 0.3 s, once a minute per key or per missed query.
- Not implemented: skipping on busy would mean switching the busy timeout of the shared connection around each write, for a rare wait of a few hundred milliseconds. Waiting for a decision whether to close this task without change.
<!-- SECTION:NOTES:END -->
