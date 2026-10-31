---
id: TASK-208
title: make admin-reset fails at once while the server holds the write lock
status: To Do
assignee: []
created_date: '2026-10-31 01:41'
labels:
  - ops
dependencies: []
references:
  - scripts/reset-admin.ts
  - app/src/lib/server/admin/auth.ts
priority: low
type: bug
ordinal: 270000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
`scripts/reset-admin.ts` (run by `make admin-reset`, and in the image with `node scripts/reset-admin.ts`) is meant to run next to the live server on the same database file. It opens the file with `new DatabaseSync(path)` (around line 24), so SQLite's busy timeout is 0. `resetAdmin` in `app/src/lib/server/admin/auth.ts` starts with `BEGIN IMMEDIATE` via `inTransaction`; when the server or the indexing child process holds the write lock at that moment (a sync batch, a session or `last_used_at` update), the script stops right away with "database is locked" and a stack trace, and the operator has to run it again.

The other connections already wait: the server opens with a 5 s timeout (`openMigratedDatabase` in `app/src/lib/server/db/migrate.ts`), the indexing child with 30 s, `scripts/agent-seed.ts` with `{ timeout: 5000 }`.

Found in the code audit of 2026-10-31.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 `scripts/reset-admin.ts` waits for a held write lock for a few seconds instead of failing at once
- [ ] #2 When the lock is still held after that wait, the script exits with a readable message, not a stack trace
- [ ] #3 `make image-smoke` still passes (the reset script loads in the image)
<!-- AC:END -->
