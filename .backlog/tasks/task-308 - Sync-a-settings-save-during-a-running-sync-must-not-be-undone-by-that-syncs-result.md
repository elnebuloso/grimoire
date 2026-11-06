---
id: TASK-308
title: >-
  Sync: a settings save during a running sync must not be undone by that sync's
  result
status: To Do
assignee: []
created_date: '2026-11-06 20:51'
labels:
  - sync
dependencies: []
references:
  - app/src/lib/server/admin/sources.ts
  - app/src/lib/server/db/sources.ts
  - app/src/lib/server/sync/sync.ts
  - app/src/lib/server/sync/index-worker.ts
priority: medium
type: bug
ordinal: 370000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
`saveSource` (`app/src/lib/server/admin/sources.ts`, writing through `app/src/lib/server/db/sources.ts`) sets `last_commit` and `failed_commit` to NULL when a change affects the index, so the next sync re-indexes with the new settings (TASK-204, TASK-210). A sync that is already running started with the old path, branch and exclusions and writes `last_commit = <commit>` when it finishes (index worker, `app/src/lib/server/sync/index-worker.ts`), or `failed_commit` through `recordSyncError`.

Case:
1. An admin clicks "sync now" on a source, or a scheduled sync of it is running.
2. Meanwhile syncs are paused (globally or for the source), the admin adds `docs/internal/**` to the exclusions and saves. Because syncs are paused, no forced sync is queued.
3. The running sync finishes and writes `last_commit = c1`, built with the old exclusions.
4. After resuming, the next check sees `latest === lastCommit` and returns `unchanged`.

The excluded pages stay indexed and readable by agents until a new commit is pushed. The same race restores `failed_commit` and defeats the retry after a settings change. No spec covers a save during a running sync.

Suggested fix: pass the index-relevant settings (git URL, branch, path, exclusions) in the `IndexJob`, and write `last_commit` (and `failed_commit` in `recordSyncError`) only when the stored settings still match them, otherwise NULL.

Found by a whole-repo audit on 2026-11-06 (commit 601c588 plus six local refactor commits).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 When the index-relevant settings change while a sync of the source runs, that sync's completion leaves `last_commit` empty so the next sync re-indexes
- [ ] #2 The same holds for `failed_commit` when the running sync fails
- [ ] #3 A sync whose settings were not changed meanwhile records its commit as before
- [ ] #4 A spec covers a save between the start and the end of a sync
<!-- AC:END -->
