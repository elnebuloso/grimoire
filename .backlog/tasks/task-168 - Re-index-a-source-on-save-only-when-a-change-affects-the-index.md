---
id: TASK-168
title: Re-index a source on save only when a change affects the index
status: Done
assignee:
  - '@claude'
created_date: '2026-10-30 16:13'
updated_date: '2026-10-30 16:30'
labels:
  - admin
  - sync
milestone: m-0
dependencies: []
priority: medium
type: enhancement
ordinal: 230000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Saving a source in `app/src/routes/manage/sources/[id]/+page.server.ts` always forces a sync ("Forced, so a changed path or exclusions take effect"). Changing only the name, description or visibility therefore re-clones and re-indexes the source from scratch on the single sync lane every other source waits behind. `docs/handbook/docker.md` measures one large source at 76 s unconstrained and 426 s at 0.5 CPU, so switching five sources to public on a small pod queues over half an hour of indexing that changes nothing. `accessChanged` (`app/src/lib/server/admin/source-access.ts`) already answers the same question for Git access. `docs/handbook/admin.md` documents that saving retries a failed commit, which has to keep working.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Saving a change to Git URL, branch, path or exclusions forces a sync
- [x] #2 Saving a source that has a stored sync error forces a sync
- [x] #3 Saving only name, description or visibility of a healthy source forces no sync
- [x] #4 Tests cover each of the three cases
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. `savingReindexes` in `admin/sources.ts`: new source, stored error, or changed Git URL, branch, path or exclusions
2. The save action requests the sync forced only then, unforced (a check for a new commit) otherwise
3. Route tests for each case; handbook "After saving"
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Saving without an index change still requests an unforced sync: a cheap `ls-remote` check, so resuming a paused source still picks up commits made meanwhile.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Saving a source forces a full sync only when Git URL, branch, path or exclusions changed or its last sync failed (`savingReindexes` in `app/src/lib/server/admin/sources.ts`). Other saves (name, description, visibility, schedule, resuming) request an unforced sync, which only checks the branch for a new commit, so they no longer hold the single sync lane for a full re-index. Handbook "After saving" updated. Verified: new route test walks each field and the stored-error case, fails without the change; source route and admin tests green; `make handbook` strict.
<!-- SECTION:FINAL_SUMMARY:END -->
