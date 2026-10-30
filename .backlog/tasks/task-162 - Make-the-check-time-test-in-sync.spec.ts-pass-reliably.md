---
id: TASK-162
title: Make the check-time test in sync.spec.ts pass reliably
status: To Do
assignee: []
created_date: '2026-10-30 15:48'
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
- [ ] #2 The test no longer depends on machine load, timing or the order tests run in
- [ ] #3 Repeated full `make test` runs (at least 10 in a row) pass
<!-- AC:END -->
