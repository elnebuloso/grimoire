---
id: TASK-315
title: >-
  Sync: the deadline kill must also stop the git processes the indexing worker
  started
status: To Do
assignee: []
created_date: '2026-11-06 20:51'
labels:
  - sync
dependencies: []
references:
  - app/src/lib/server/sync/sync.ts
  - app/src/lib/server/sync/git.ts
priority: medium
type: bug
ordinal: 377000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
When indexing runs past its deadline, `indexInProcess` in `app/src/lib/server/sync/sync.ts` kills the forked worker with `child.kill('SIGKILL')` and then removes the checkout (`rm(checkout, …)`). The worker may be running a git child of its own, e.g. `git sparse-checkout add` to fetch include directories (`app/src/lib/server/sync/git.ts`, started via `execFile` with a timeout). SIGKILL reaches only the worker: the git process keeps running, and its timeout timer lived in the dead worker, so nothing stops it if the Git server hangs. Meanwhile `rm` runs against a directory git is still writing into (guess, not reproduced: it can leave the temp directory behind or fail with ENOTEMPTY, replacing the deadline error with a meaningless one).

Case: a large monorepo whose indexing deadline hits during an include-directory fetch.

Suggested fix: fork the worker with `detached: true` and kill the whole process group with `process.kill(-child.pid, 'SIGKILL')`.

Found by a whole-repo audit on 2026-11-06 (commit 601c588 plus six local refactor commits).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 After a deadline kill, no git process started by the worker is still running
- [ ] #2 The checkout directory is removed after a deadline kill and the stored error is the deadline error
- [ ] #3 A spec in `sync.spec.ts` covers a worker whose git child outlives the deadline
<!-- AC:END -->
