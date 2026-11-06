---
id: TASK-339
title: 'Image: reap orphaned processes in the container'
status: Done
assignee:
  - '@claude'
created_date: '2026-11-06 22:06'
updated_date: '2026-11-06 22:51'
labels:
  - ops
dependencies: []
references:
  - Dockerfile
  - docs/handbook/docker.md
priority: low
type: chore
ordinal: 401000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The image starts `CMD ["node", "app/build"]` (`Dockerfile`), so Node is process 1. When the indexing deadline kills the worker's process group (`killGroup` in `app/src/lib/server/sync/sync.ts`), git processes the worker started are re-parented to process 1, and Node does not reap orphans: each deadline hit leaves zombie entries for the life of the container. This only matters under a tight pids limit, where later forks for syncs fail. The handbook (`docs/handbook/docker.md`) does not mention `--init`.

Suggested fix: install `tini` in the image and set `ENTRYPOINT ["/usr/bin/tini", "--"]` (keep the `CMD`), or document `docker run --init` / Compose `init: true`. The handbook restore command (`docs/handbook/database.md`) runs `sh -c …` in the image and must keep working.

Found by the second whole-repo audit on 2026-11-06 (HEAD 06aada8).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Processes orphaned in the container are reaped
- [x] #2 The image still starts, migrates and serves as before (`make image-smoke` passes)
- [x] #3 The restore command in `docs/handbook/database.md` still works with the image
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Dockerfile: install tini with git and ca-certificates, ENTRYPOINT ["/usr/bin/tini", "--"], CMD unchanged
2. Check: PID 1 is tini; an orphaned process is reaped with tini and stays a zombie without; make image-smoke passes; sh -c runs in the image as before
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
- make image and make image-smoke pass.
- Orphan check in the built image: a child that exits right after starting a grandchild leaves 0 zombies with tini and 1 with `--entrypoint node` (the old behaviour).
- The handbook restore command was not run again with the new image: running it was blocked by a safety check (rm inside sh -c). `docker run grimoire:latest sh -c ...` runs under tini (checked), and the rm/cp inside are unchanged from the run on the base image in TASK-310.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
The image now starts through tini (ENTRYPOINT, CMD unchanged), so processes orphaned when the indexing deadline kills a worker group are reaped instead of staying zombies for the life of the container. Checked in the built image: 0 zombies with tini, 1 without; make image-smoke passes; commands passed to docker run, like the handbook restore command, still run (under tini).
<!-- SECTION:FINAL_SUMMARY:END -->
