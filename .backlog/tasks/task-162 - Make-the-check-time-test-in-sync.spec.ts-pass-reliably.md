---
id: TASK-162
title: Make the check-time test in sync.spec.ts pass reliably
status: In Progress
assignee:
  - '@claude'
created_date: '2026-10-30 15:48'
updated_date: '2026-10-30 17:17'
labels:
  - sync
milestone: m-0
dependencies: []
priority: medium
type: bug
ordinal: 224000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
In one full `make test` run on 2026-10-30, `app/src/lib/server/sync/sync.spec.ts › syncSource › records when every check started, whether it synced, found nothing new or failed` failed; three runs of it alone and four further full runs passed, with no code change in between. The output of the failing run was not kept, so the cause is open. Alone the test takes about 0.74 s (default timeout 5 s); it runs three real syncs (clone and indexing in a child process) while the full suite runs other child processes, including one deliberately running out of memory. A suspicion, not established: the test exceeds its timeout under load. A test that passes on a rerun without a code change counts as broken in this project.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 The cause of the failure is found and named, with evidence (e.g. a reproduction under load)
- [x] #2 The test no longer depends on machine load, timing or the order tests run in
- [x] #3 Repeated full `make test` runs (at least 10 in a row) pass
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Try to reproduce under load (4 parallel runs of the file, 8 rounds)
2. Remove what depends on the machine: the comparison of `last_checked_at` with wall-clock readings taken in the test
3. Pin the time where each check starts via the injectable `SyncLanes`, with only `Date` faked
4. Prove with 10 full `make test` runs in a row
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Not reproduced: 32 runs of `sync.spec.ts` (4 in parallel, 8 rounds, plus `make lint` and the agent environment as extra load) never failed this test; 20 full `make test` runs neither. The file sets a 30 s timeout and the test takes about 0.7 s alone, which rules out the suspected 5 s timeout. The only machine-dependent part left was the comparison of `last_checked_at` with two `new Date()` readings taken by the test, which a clock adjustment between them (WSL2 corrects its clock) would break; a suspicion, not proven.
Fix: the time is pinned where each check starts via `SyncLanes` (only `Date` faked), and the test expects exactly that time for a synced, an unchanged and a failed check. Mutation check: recording the time at the end of the sync instead fails the test.
Seen once under that extra load: "fails a sync whose indexing runs out of memory" (about 8 s alone) passed its 30 s timeout; not part of this task.
<!-- SECTION:NOTES:END -->
