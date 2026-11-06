---
id: TASK-321
title: 'Sync: remove checkouts left behind by a crash'
status: To Do
assignee: []
created_date: '2026-11-06 20:52'
labels:
  - sync
  - ops
dependencies: []
references:
  - app/src/lib/server/sync/sync.ts
  - app/src/hooks.server.ts
priority: low
type: bug
ordinal: 383000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
`syncSource` in `app/src/lib/server/sync/sync.ts` creates a `grimoire-sync-*` directory with `mkdtemp` under `options.workDirectory ?? tmpdir()` and removes it in `finally`. If the server is killed during a clone or index (SIGKILL, OOM kill by the container – the code expects this elsewhere), the directory stays. Nothing cleans it at start (`init` in `app/src/hooks.server.ts`). For a large monorepo each crash leaves a full sparse clone, and the disk fills slowly on unstable hosts.

A blanket cleanup of `grimoire-sync-*` in the shared `tmpdir()` is not safe: `make e2e` runs a second instance (port 4174) whose live checkouts would be deleted.

Suggested fix: keep work directories under a directory owned by the instance (e.g. next to `DATABASE_PATH`) and empty it in `init`.

Found by a whole-repo audit on 2026-11-06 (commit 601c588 plus six local refactor commits).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Checkouts left by a previous process of the same instance are removed at start
- [ ] #2 Checkouts of another instance on the same host are not touched
- [ ] #3 A spec covers the cleanup at start
<!-- AC:END -->
