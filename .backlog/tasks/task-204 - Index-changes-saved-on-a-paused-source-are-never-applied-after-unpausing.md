---
id: TASK-204
title: Index changes saved on a paused source are never applied after unpausing
status: Done
assignee:
  - '@claude'
created_date: '2026-10-31 01:36'
updated_date: '2026-10-31 01:50'
labels:
  - admin
  - sync
dependencies: []
references:
  - 'app/src/routes/manage/sources/[id]/+page.server.ts'
  - app/src/lib/server/admin/sources.ts
  - app/src/lib/server/sync/sync.ts
priority: medium
type: bug
ordinal: 266000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Saving a source with a changed Git URL, branch, path or exclusions must re-index it even without a new commit (TASK-168). The `save` action in `app/src/routes/manage/sources/[id]/+page.server.ts` (around lines 97-103) computes `savingReindexes(...)` but only queues the forced sync when `syncsAutomatically(db, form)` is true.

When the source is paused, or all syncs are paused in Settings (`syncs_paused`), nothing is queued and the "needs re-index" decision is lost. When the admin unpauses later, the next save compares the stored values (already the new ones) and returns false, and polling sees `latest === last_commit` and reports "unchanged" (`checkAndSync` in `app/src/lib/server/sync/sync.ts`). The index keeps serving the old path or the excluded pages until someone pushes a commit or clicks "Sync now" — with no hint in the UI.

Reproduce: pause a synced source, change its path, save; unpause (source or global setting) and wait for polling → status "unchanged", pages still from the old path.

Found in the code audit of 2026-10-31.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 A change to Git URL, branch, path or exclusions saved while the source is paused is indexed by the first sync after unpausing the source, without a new commit
- [x] #2 The same holds when the change was saved while all syncs were paused in Settings and they are resumed
- [x] #3 A paused source still does not sync on its own while paused
- [x] #4 A test covers the paused case and fails before the fix
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. saveSource clears last_commit and failed_commit in the same UPDATE when Git URL, branch, path or exclusions change, so any later sync sees the branch as moved and does not skip a commit that failed under the old settings.
2. The save action keeps its forced sync for sources that sync automatically; paused sources simply wait for their next sync.
3. Tests in sync-logic.spec.ts with the real saveSource and syncSource: paused source, globally paused syncs, a failed commit, and a save that changes nothing for the index.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
The two bug tests (paused source, failed commit) failed before the fix with 'unchanged' and 'failed'. The paused source staying out of polling is unchanged code (listSchedules), covered by sources.spec.ts 'leaves a paused source out of polling'. Side effect: after such a save the source page shows 'Last commit: none' until the next sync, which is accurate, since no index for the new settings exists yet.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Saving a change to Git URL, branch, path or exclusions now clears last_commit and failed_commit of the source. A source that was paused (or saved while all syncs were paused) therefore re-indexes at its first sync after unpausing, without a new commit, also when the previous commit had failed to index under the old settings. Saves that touch nothing the index depends on keep the index as it is. Tests: four new cases in sync-logic.spec.ts, make test --changed green (138 tests).
<!-- SECTION:FINAL_SUMMARY:END -->
