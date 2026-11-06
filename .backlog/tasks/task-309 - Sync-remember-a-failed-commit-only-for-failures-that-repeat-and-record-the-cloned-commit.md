---
id: TASK-309
title: >-
  Sync: remember a failed commit only for failures that repeat, and record the
  cloned commit
status: Done
assignee:
  - '@claude'
created_date: '2026-11-06 20:51'
updated_date: '2026-11-06 21:13'
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
- [x] #1 A sync that fails during indexing with a transient kind (`unreachable`, `noAddress`, `unknown`) is retried at the next scheduled check for the same commit
- [x] #2 A sync that fails with a repeating kind is still skipped for the same commit until forced or a new commit arrives
- [x] #3 The commit recorded as failed is the one that was cloned and indexed
- [x] #4 Specs in `sync-logic.spec.ts` or `sync.spec.ts` cover both kinds
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Specs: a noAddress failure during indexing is retried for the same commit; the commit recorded as failed is the cloned one when the branch moved between check and clone
2. sync.ts records failed_commit only for REPEATING_KINDS (noPage, path, deadline, aborted) and uses the cloned commit
3. Handbook admin.md says which failures wait for a new commit
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
- Both specs failed before and pass after; sync-logic.spec.ts and sync.spec.ts pass (22 tests); make handbook passes.
- A transient failure leaves failed_commit as it was (recordSyncError without a commit), so a commit that failed for a repeating reason earlier is still skipped.
- unknown is not in REPEATING_KINDS: an unclassified error is retried rather than silently pinned.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
A sync now remembers a commit as failed only when indexing it again would fail the same way (no page, missing path, deadline, out of memory); a network error or a locked database while indexing is retried at the next check instead of pinning the source until the next push. The failed commit recorded is the one cloned and indexed, not the one the check saw. Specs in sync-logic.spec.ts cover both; the handbook names which failures wait for a new commit.
<!-- SECTION:FINAL_SUMMARY:END -->
