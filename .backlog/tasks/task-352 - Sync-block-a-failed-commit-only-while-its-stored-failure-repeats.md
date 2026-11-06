---
id: TASK-352
title: 'Sync: block a failed commit only while its stored failure repeats'
status: To Do
assignee: []
created_date: '2026-11-06 23:46'
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
- [ ] #1 After a repeating failure of commit X and a later network failure before indexing, the next scheduled check tries X again
- [ ] #2 A commit whose stored failure repeats is still skipped until forced or a new commit arrives
- [ ] #3 A spec in `sync-logic.spec.ts` covers the sequence
<!-- AC:END -->
