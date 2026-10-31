---
id: TASK-204
title: Index changes saved on a paused source are never applied after unpausing
status: To Do
assignee: []
created_date: '2026-10-31 01:36'
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
- [ ] #1 A change to Git URL, branch, path or exclusions saved while the source is paused is indexed by the first sync after unpausing the source, without a new commit
- [ ] #2 The same holds when the change was saved while all syncs were paused in Settings and they are resumed
- [ ] #3 A paused source still does not sync on its own while paused
- [ ] #4 A test covers the paused case and fails before the fix
<!-- AC:END -->
