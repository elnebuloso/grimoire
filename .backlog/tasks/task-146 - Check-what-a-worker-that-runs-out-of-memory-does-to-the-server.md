---
id: TASK-146
title: Check what a worker that runs out of memory does to the server
status: Done
assignee:
  - '@claude'
created_date: '2026-10-30 11:29'
updated_date: '2026-10-30 11:53'
labels:
  - sync
milestone: m-0
dependencies: []
priority: medium
type: spike
ordinal: 208000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Open point from the second whole-project code review of 2026-10-30. Indexing runs in a worker thread (`indexInWorker` in `app/src/lib/server/sync/sync.ts`, entry `app/src/lib/server/sync/index-worker.ts`); the comment above `indexInWorker` claims that a docs branch exhausting memory there ends only the sync, not the server. Nobody has verified this: the worker is started without `resourceLimits`, and whether Node ends only the worker or the whole process when its heap is exhausted, and what the container memory limit does first, was not checked. Include expansion is capped (1,000,000 characters per page, 100 URL includes per sync), but a large repository or a parser bug can still use a lot of memory. If the process dies instead, every sync of that source would take the server down until the commit changes.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 A worker that exhausts its memory is tried in this project (test or documented experiment with the Node version of the image, `node:24.22.1` in `Dockerfile`), and the result is written in the task notes
- [x] #2 If only the sync fails: a test keeps it that way (the sync ends as `failed` with a readable error and the server keeps answering)
- [x] #3 If the process dies: the worker gets `resourceLimits` (or an equivalent) so it ends only the sync, with such a test, and the comment above `indexInWorker` states what is true
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Experiment with Node 24.22.1 (host and node:24.22.1-trixie-slim containers) on a worker thread and a child process that allocate until out of memory.
2. Result: worker threads do not reliably end only themselves, so move indexing into a child process (fork of index-worker.ts, job over IPC so the token stays out of the process list); the deadline kills it with SIGKILL.
3. Test seam indexingHeapMb; test: a 3.6 MB page at 32 MiB heap fails the sync with a readable error, a second source then syncs.
4. image-smoke.sh, Dockerfile comment and handbook (docker.md, database.md) follow.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Experiments (Node 24.22.1, a script that allocates until the heap is exhausted):
- Worker thread without resourceLimits, host (heap 2.2 GB): only the worker ended (ERR_WORKER_OUT_OF_MEMORY), 6/6.
- Worker thread without limits in containers: 512 MiB and 1 GiB only the worker ended; 256 MiB (the smallest size docker.md lists) the kernel killed the whole process (exit 137), 2/2 allocation patterns.
- Worker thread with resourceLimits.maxOldGenerationSizeMb on the host: with 1 MB strings the whole process died with "FATAL ERROR: Reached heap limit" in 5 of 6 runs at 256 MB, also at 96 and 128 MB; 192, 320, 384-768 MB survived. Small objects survived at 64 and 256 MB. So resourceLimits makes it worse, not safer.
- Child process (fork) with --max-old-space-size 128/256 on the host: parent survived 12/12. In a 256 MiB container without any limit: the child was killed with SIGKILL and the parent survived, 6/6.
- Worker.terminate() / killing the process during a transaction released the SQLite lock and rolled back (checked for the thread in TASK-132; the deadline test passes with the process).
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Measured first: a worker thread that runs out of memory does not reliably end only itself. With resourceLimits the whole process died in 5 of 6 runs, and in a 256 MiB container the kernel killed the whole server. A child process was killed alone in every run (12 on the host, 6 in a 256 MiB container). Indexing therefore now runs in a child process: `index-worker.ts` receives the job over IPC (so the Git token is not in the process list), reports errors as `{ error }` and exits if the server goes away. `sync.ts` (`indexInProcess`) starts it with an empty execArgv, kills it with SIGKILL at the deadline, and turns an early end into "indexing ended with <signal> before it finished, out of memory for example". New sync.spec test: a 3.6 MB page with a 32 MiB child heap (`indexingHeapMb`, test seam) fails the sync with that error, and the next source syncs; stable in 3 runs. image-smoke.sh, the Dockerfile comment and the handbook (docker.md, database.md) follow. make lint, make handbook, make image + make image-smoke pass; synced by hand in the agent environment (both fixture sources synced, archive fails as expected). The resource table in docker.md was measured with the worker thread; a second process adds the baseline memory of a Node process.
<!-- SECTION:FINAL_SUMMARY:END -->
