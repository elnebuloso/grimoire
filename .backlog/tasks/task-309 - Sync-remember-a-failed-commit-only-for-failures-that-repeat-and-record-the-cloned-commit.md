---
id: TASK-309
title: >-
  Sync: remember a failed commit only for failures that repeat, and record the
  cloned commit
status: To Do
assignee: []
created_date: '2026-11-06 20:51'
labels:
  - sync
dependencies: []
references:
  - app/src/lib/server/sync/sync.ts
  - app/src/lib/server/sync/error-kind.ts
priority: medium
type: bug
ordinal: 371000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
`syncSource` in `app/src/lib/server/sync/sync.ts` sets `indexingCommit = latest` just before the indexing worker starts. Every error after that point is stored as `failed_commit` via `recordSyncError`, and later checks skip a source whose `latest === failedCommit` ("Indexing the same commit again fails the same way", TASK-148) unless forced.

Problems:
- Not every failure repeats. The worker fetches include directories lazily from the Git server (`addSparseDirectories` in `sync/git.ts`); a network hiccup or the git timeout gives kind `unreachable`/`noAddress`, and a database lock past the timeout gives `unknown`. After one such failure the commit is never retried by the scheduler; the source stays stale until a new push or a manual "sync now".
- `latest` comes from `ls-remote`, while `commit` (from `headCommit(checkout)`) is what was actually cloned and indexed. If someone pushes between the check and the clone, the wrong commit is recorded as failed and the next run repeats the full failing index.

Suggested fix: pass the commit to `recordSyncError` only for kinds that fail the same way again (`noPage`, `path`, `deadline`, `aborted`; check `app/src/lib/server/sync/failure.ts` / `error-kind.ts` for the full list) and record `commit` instead of `latest`.

Found by a whole-repo audit on 2026-11-06 (commit 601c588 plus six local refactor commits).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 A sync that fails during indexing with a transient kind (`unreachable`, `noAddress`, `unknown`) is retried at the next scheduled check for the same commit
- [ ] #2 A sync that fails with a repeating kind is still skipped for the same commit until forced or a new commit arrives
- [ ] #3 The commit recorded as failed is the one that was cloned and indexed
- [ ] #4 Specs in `sync-logic.spec.ts` or `sync.spec.ts` cover both kinds
<!-- AC:END -->
