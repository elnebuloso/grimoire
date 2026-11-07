---
id: TASK-352
title: 'Sync: block a failed commit only while its stored failure repeats'
status: Done
assignee:
  - '@claude'
created_date: '2026-11-06 23:46'
updated_date: '2026-11-07 00:08'
labels:
  - sync
dependencies: []
references:
  - app/src/lib/server/sync/sync.ts
priority: medium
type: bug
ordinal: 414000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
`checkAndSync` in `app/src/lib/server/sync/sync.ts` returns early (around lines 113-116) when `latest === source.failedCommit && source.error && !options.force`, reporting the stored error. Since TASK-328, a passing failure *while indexing* clears `failed_commit`, but a failure before indexing started (`indexingCommit` undefined: the remote check or `sparseClone`) leaves it unchanged – and `sparseClone` is the most likely place for a network error.

Case: commit X failed with `deadline`, so `failed_commit = X`. A forced sync fails in `sparseClone` with a network error, which is now the stored error. Every later scheduled check succeeds at `ls-remote`, hits the early return and reports the stored network error every tick without retrying, while the real cause (`deadline`) is hidden. The handbook (`docs/handbook/admin.md`) says other failures are retried at the next check.

Suggested fix: return early only when the stored error kind is one that repeats: add `&& REPEATING_KINDS.has(kind)` (kind from `source.errorKind ?? syncErrorKind(source.error)`) to the early-return condition.

Found by the third whole-repo audit on 2026-11-07 (HEAD 4a72798).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 After a repeating failure of commit X and a later network failure before indexing, the next scheduled check tries X again
- [x] #2 A commit whose stored failure repeats is still skipped until forced or a new commit arrives
- [x] #3 A spec in `sync-logic.spec.ts` covers the sequence
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Spec: after a deadline failure of c1, a forced run failing in sparseClone with a network error lets the next scheduled sync index c1
2. The early return for a failed commit applies only while the stored error kind is in REPEATING_KINDS
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
- The spec failed before and passes after; sync-logic.spec.ts and sync.spec.ts pass (30 tests). The existing spec for a commit whose stored failure repeats still skips it.
- failed_commit itself is left as it is; the stored kind decides whether it holds the commit back.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
A commit remembered as failed is now skipped only while the stored failure is one that repeats (no page, missing path, deadline, out of memory). After a later network failure, for example while cloning, the next scheduled check tries the commit again, as the handbook says, instead of reporting the network error on every tick. Covered by a spec in sync-logic.spec.ts.
<!-- SECTION:FINAL_SUMMARY:END -->
