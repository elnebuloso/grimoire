---
id: TASK-202
title: Test the WAL retry of openMigratedDatabase deterministically
status: Done
assignee:
  - '@claude'
created_date: '2026-10-31 01:30'
updated_date: '2026-10-31 11:52'
labels: []
milestone: m-1
dependencies: []
priority: medium
type: task
ordinal: 264000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The test "applies each migration exactly once when two processes migrate a new file at once" in `app/src/lib/server/db/migrate.spec.ts` runs 20 rounds of two real `node` processes migrating a new database file at once. It is meant to catch two things: a migration applied twice, and the `SQLITE_BUSY` that switching a new file to WAL can raise, which `enableWriteAheadLog` in `app/src/lib/server/db/migrate.ts` retries. Measured during TASK-191: with the retry removed, the test failed in only 3 of 8 runs, not "almost every run" as its comment claims, so a broken retry usually ships unnoticed. It also takes about 6 s alone (12 s within the full run), the second slowest spec file; running the rounds in parallel made it faster but caught the broken retry in 0 of 8 runs.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 A test forces the WAL switch of a new database file to meet a lock held by another connection and checks that `openMigratedDatabase` succeeds; with the retry in `enableWriteAheadLog` removed, it fails on every run (checked at least 5 times)
- [x] #2 Applying each migration exactly once under two concurrent migrators is still tested, and still fails when the transaction no longer reads the version under the write lock
- [x] #3 The comment about how often the race test catches a failure states what was measured
- [x] #4 `migrate.spec.ts` takes less time than before (about 6 s alone), and the measured time in `.claude/rules/testing-strategy.md` is updated
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Replace the 20-round two-process race in migrate.spec.ts with tests where a worker thread holds a write lock on the same file while openMigratedDatabase runs.
2. WAL test: the worker holds BEGIN IMMEDIATE on a new file (measured: PRAGMA journal_mode = WAL then fails with SQLITE_BUSY at once, without the busy timeout); openMigratedDatabase must succeed once the lock is released.
3. Exactly-once test: on a WAL file the worker applies migration 1 under BEGIN IMMEDIATE and holds it; openMigratedDatabase reads version 0 first and must skip migration 1 after getting the lock.
4. Check both fail with the retry removed / the version read outside the lock (5 runs each), measure the file time, update testing-strategy.md.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Measured: a second connection holding BEGIN IMMEDIATE on a new file makes PRAGMA journal_mode = WAL fail with SQLITE_BUSY after 0 ms; BEGIN EXCLUSIVE and a read transaction are waited out by the busy handler instead. A worker thread holds the lock (300 ms), so no child processes are needed.
Mutation checks, 5 runs each: retry removed -> 'switches a new file to WAL ...' fails 5/5 (database is locked); version read from the value before the lock -> 'skips a migration another connection applied ...' fails 5/5 (table notes already exists).
migrate.spec.ts: 1.3 s alone in vitest (was about 6 s). Full make test 45 s (was 63 s); make lint and make e2e (21 passed) green.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Replaced the 20-round two-process race in app/src/lib/server/db/migrate.spec.ts with two deterministic tests in which a worker thread holds the write lock on the same file: one forces the WAL switch of a new file onto SQLITE_BUSY and checks openMigratedDatabase succeeds, the other applies migration 1 in the other connection while openMigratedDatabase waits and checks it is skipped. Each fails 5/5 against its mutation (retry removed, version read outside the lock). The file runs in 1.3 s instead of about 6 s; .claude/rules/testing-strategy.md has the new make test time (45 s) and no longer lists migrate.spec.ts as slow. Note: when the retry is broken, the worker's COMMIT can additionally log a disk I/O error because the temp dir is removed first; it only shows when the test already fails.
<!-- SECTION:FINAL_SUMMARY:END -->
