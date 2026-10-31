---
id: TASK-202
title: Test the WAL retry of openMigratedDatabase deterministically
status: To Do
assignee:
  - '@claude'
created_date: '2026-10-31 01:30'
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
- [ ] #1 A test forces the WAL switch of a new database file to meet a lock held by another connection and checks that `openMigratedDatabase` succeeds; with the retry in `enableWriteAheadLog` removed, it fails on every run (checked at least 5 times)
- [ ] #2 Applying each migration exactly once under two concurrent migrators is still tested, and still fails when the transaction no longer reads the version under the write lock
- [ ] #3 The comment about how often the race test catches a failure states what was measured
- [ ] #4 `migrate.spec.ts` takes less time than before (about 6 s alone), and the measured time in `.claude/rules/testing-strategy.md` is updated
<!-- AC:END -->
