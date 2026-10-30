---
id: TASK-173
title: Record the failing commit in the sync history
status: Done
assignee:
  - '@claude'
created_date: '2026-10-30 16:13'
updated_date: '2026-10-30 16:33'
labels:
  - sync
milestone: m-0
dependencies: []
priority: low
type: enhancement
ordinal: 235000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
When a sync fails, the failing commit is known and stored on the source as `failed_commit`, but `sync_runs.commit_hash` stays `NULL` for every failed run (`app/src/lib/server/sync/sync.ts`). The history cannot show which commit broke, or that the same commit kept failing.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 A failed run whose commit is known stores it in `sync_runs.commit_hash`
- [x] #2 A failed run before a commit is known (e.g. clone error) keeps `NULL`
- [x] #3 A test covers both cases
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. The `failed` sync result carries the commit when one was being indexed (also for the skipped retry of a known failed commit)
2. `syncSource` stores it in `sync_runs.commit_hash`
3. Tests: failed indexing run keeps its commit; ls-remote failure keeps NULL
<!-- SECTION:PLAN:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
A failed sync run now stores the commit it failed on in `sync_runs.commit_hash` (`app/src/lib/server/sync/sync.ts`); repeated checks of the same failed commit fold into one history row with a run count. A failure before a commit is known (unreachable Git server) keeps `NULL`. Verified: sync test checks history row `failed` with the commit and 2 runs (fails without the change); the existing history test covers the `NULL` case; all 20 sync tests green.
<!-- SECTION:FINAL_SUMMARY:END -->
