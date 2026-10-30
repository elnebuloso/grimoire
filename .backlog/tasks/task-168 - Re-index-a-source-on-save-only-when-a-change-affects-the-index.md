---
id: TASK-168
title: Re-index a source on save only when a change affects the index
status: To Do
assignee: []
created_date: '2026-10-30 16:13'
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
- [ ] #1 Saving a change to Git URL, branch, path or exclusions forces a sync
- [ ] #2 Saving a source that has a stored sync error forces a sync
- [ ] #3 Saving only name, description or visibility of a healthy source forces no sync
- [ ] #4 Tests cover each of the three cases
<!-- AC:END -->
