---
id: TASK-154
title: Re-measure the memory and CPU table for indexing in a child process
status: Done
assignee:
  - '@claude'
created_date: '2026-10-30 13:41'
updated_date: '2026-10-30 14:21'
labels:
  - ops
milestone: m-0
dependencies: []
priority: medium
type: docs
ordinal: 216000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Found by the whole-project code review of 2026-10-30 (13:25). The table under "Memory and CPU limits" in `docs/handbook/docker.md` (Kubernetes documentation as one source, 1722 pages, 13,160 snippets, agents searching every 25 ms; rows: none 77 s / 933 MiB; 1 CPU, 512 MiB 160 s / 392 MiB; 0.5 CPU, 256 MiB 383 s / 256 MiB at the limit) and the recommendation `limits: { cpu: "1", memory: 512Mi }` were measured while indexing still ran in a worker thread. TASK-146 moved indexing into a child process, which adds the baseline memory of a second Node process; its summary says so. An operator sizing a pod from the table may therefore set a limit at which syncs now fail with `indexing ended with … before it finished, out of memory for example`.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 The table in `docs/handbook/docker.md` reflects measurements of the current build (image with indexing in a child process), or is clearly marked as measured before that change with the extra memory stated
- [x] #2 The recommended `limits`/`requests` match the table
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. `make image` at the current build (indexing in a child process).
2. Per limit setting: fresh database (fixture seed, sources replaced by the Kubernetes docs, `https://github.com/kubernetes/website.git`, `main`, `content/en/docs`), container with `--cpus`/`--memory`, one agent search every 25 ms (`/p/platform/query?q=install+configure&tokens=500`, `Connection: close`) during the first sync; sync time from `sync_runs`, memory as cgroup `memory.peak`.
3. Replace the table rows; keep the recommendation if it still holds.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Measured 2026-10-30 at commit b136403 (image `grimoire:latest`, Docker 29.9.1, 4 CPUs host), first sync of the Kubernetes documentation (1722 pages, 13160 snippets), agent search every 25 ms:
- no limits: sync 76 s; 2194 searches, p50 9.0 ms, p95 20.1 ms, p99 44.4 ms, max 365 ms; cgroup peak 923 MiB, server process VmHWM 191 MiB.
- --cpus 1 --memory 512m: sync 149 s; 3754 searches, p99 70.1 ms, max 800 ms; cgroup peak 437 MiB; no OOM kill.
- --cpus 0.5 --memory 256m: sync 426 s; 5599 searches, p50 62.5 ms, p99 178 ms, max 953 ms; cgroup at its 256 MiB limit (memory.events max 1181), oom_kill 0, synced.
All searches answered 200. Compared with the worker-thread figures: memory peaks about the same (the cgroup peak includes page cache), searches during a sync somewhat slower at the 99th percentile, the 0.5 CPU sync 426 s instead of 383 s, still within the 10-minute default deadline. The recommendation (1 CPU, 512Mi) still holds.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Re-measured the "Memory and CPU limits" table in `docs/handbook/docker.md` with the current image, where indexing runs in a child process, using the same method as before. New rows: no limits 76 s / p99 44 ms / 923 MiB; 1 CPU, 512 MiB 149 s / 70 ms / 437 MiB; 0.5 CPU, 256 MiB 426 s / 178 ms / 256 MiB at the limit, no OOM kill. The recommended `limits`/`requests` still match. `make handbook` passes.
<!-- SECTION:FINAL_SUMMARY:END -->
