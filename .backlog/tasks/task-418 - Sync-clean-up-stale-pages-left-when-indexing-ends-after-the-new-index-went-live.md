---
id: TASK-418
title: >-
  Sync: clean up stale pages left when indexing ends after the new index went
  live
status: To Do
assignee: []
created_date: '2026-11-09 10:17'
labels:
  - sync
dependencies: []
priority: low
type: bug
ordinal: 480000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
### What this is
The indexing child process (`app/src/lib/server/sync/index-worker.ts`) writes the new index with `replaceSourceIndex` (`app/src/lib/server/db/sources.ts`), which switches the source to the new generation and then deletes the old one (`deleteStalePages`), and only then sends its outcome to the server. The server (`app/src/lib/server/sync/sync.ts`) clears the indexing deadline only when the child closes.

### Problem
If the deadline fires, or memory runs out, while the old generation is being deleted, the new index is already live, but the sync records a `deadline` or `aborted` error with `failed_commit` set to the commit that is live. The leftover pages, snippets and FTS rows of the old generation stay until the branch moves again; search ignores them, they only take space. The next check finds the branch unchanged and clears the error.

### Fix
Smallest option: also call `deleteStalePages` for a source on the unchanged path of a sync, so leftovers go with the next check. Alternatively send the outcome before deleting the old generation. Pick one; add a case to `app/src/lib/server/sync/sync.spec.ts` (the slow spec; see `.claude/rules/testing-strategy.md`).

### If we skip it
A rare false sync error that disappears on the next check, and stale rows on disk until the branch moves.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Leftover rows of an old generation are removed by the next sync, also when the branch is unchanged
- [ ] #2 sync.spec.ts covers the leftover case
<!-- AC:END -->
