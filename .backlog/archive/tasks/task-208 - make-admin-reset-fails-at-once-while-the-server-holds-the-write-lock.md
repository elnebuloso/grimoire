---
id: TASK-208
title: make admin-reset fails at once while the server holds the write lock
status: Done
assignee:
  - '@claude'
created_date: '2026-10-31 01:41'
updated_date: '2026-10-31 02:01'
labels:
  - ops
milestone: m-1
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
- [x] #1 `scripts/reset-admin.ts` waits for a held write lock for a few seconds instead of failing at once
- [x] #2 When the lock is still held after that wait, the script exits with a readable message, not a stack trace
- [x] #3 `make image-smoke` still passes (the reset script loads in the image)
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. scripts/reset-admin.ts opens the database with a busy timeout of 5 s, like the server and agent-seed.ts.
2. If the lock is still held after that (SQLITE_BUSY), it says so and to try again, exit code 1, no stack trace; other errors stay as they are.
3. Check by hand with a second process holding BEGIN IMMEDIATE for 2 s (the reset waits and succeeds) and for 8 s (readable message), the script run in a pseudo terminal via script(1); then make image and make image-smoke.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Checked with a second process holding BEGIN IMMEDIATE on the agent database, the script run in a pseudo terminal (script -qec) with the agent admin address: lock held 2 s -> the script waited and deleted the account (exit 0); held 8 s -> after 5 s 'The database stayed locked by a write of the server; nothing was changed. Run this again in a moment.' (exit 1, no stack trace). The script before the change failed at once with 'Error: database is locked' and a stack trace. make image and make image-smoke passed (reset script: ok).
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
scripts/reset-admin.ts opens the database with a 5 s busy timeout, like the server and agent-seed.ts, so a write of the running server no longer makes the reset fail at once. If the lock is still held after that, the script says so and to run it again, exits with 1 and prints no stack trace; other errors are thrown as before. Verified by hand against a held write lock (2 s: waits and succeeds; 8 s: readable message) and with make image-smoke.
<!-- SECTION:FINAL_SUMMARY:END -->
