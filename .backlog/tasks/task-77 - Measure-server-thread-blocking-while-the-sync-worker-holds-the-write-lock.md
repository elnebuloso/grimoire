---
id: TASK-77
title: Measure server-thread blocking while the sync worker holds the write lock
status: In Progress
assignee:
  - '@claude'
created_date: '2026-10-30 00:14'
updated_date: '2026-10-30 00:48'
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
- [ ] #1 The duration of the index write transaction is measured on a large documentation set and recorded in the task notes
- [ ] #2 If it can exceed about 1 s, a follow-up is agreed with the user; otherwise the task closes with the measurement
<!-- AC:END -->
