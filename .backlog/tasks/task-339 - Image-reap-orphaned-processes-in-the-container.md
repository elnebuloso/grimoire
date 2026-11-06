---
id: TASK-339
title: 'Image: reap orphaned processes in the container'
status: To Do
assignee: []
created_date: '2026-11-06 22:06'
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
- [ ] #1 Processes orphaned in the container are reaped
- [ ] #2 The image still starts, migrates and serves as before (`make image-smoke` passes)
- [ ] #3 The restore command in `docs/handbook/database.md` still works with the image
<!-- AC:END -->
