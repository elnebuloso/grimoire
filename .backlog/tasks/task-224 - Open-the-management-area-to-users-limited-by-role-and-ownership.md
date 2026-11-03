---
id: TASK-224
title: 'Open the management area to users, limited by role and ownership'
status: Done
assignee:
  - '@claude'
created_date: '2026-11-03 00:29'
updated_date: '2026-11-03 00:51'
labels:
  - admin
milestone: m-2
dependencies:
  - TASK-222
references:
  - app/src/lib/server/admin/access.ts
  - app/src/lib/server/admin/source-access.ts
priority: high
type: feature
ordinal: 286000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Today every page under `/manage` needs the role `admin`. Users are to manage their own sources there without the admin. The role `user` is implicit for every account; a check `hasRoles([...])` is satisfied only when the user holds all roles given.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Every logged-in user may open the management area; settings and the user management need `admin`
- [x] #2 Changing, deleting, syncing, renaming or changing the visibility of a source is allowed to its owner and to admins; anyone else gets 403
- [x] #3 Users see in the overview the sources they may read, admins every source
- [x] #4 Dead links and missed queries show a user only their own sources, an admin all
- [x] #5 `hasRoles` is true only when the user holds every role given
- [x] #6 Route specs cover owner, other user and admin for every source action
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. access.ts: hasRoles (all roles must match), PAGE_ROLES with role lists; /manage open to every user, /manage/settings, /manage/users and /manage/api-keys admin-only.
2. mayManageSource: owner or admin. The source page and all its actions answer 403 otherwise.
3. dashboard(db, user): readable sources listed, problems and key count for managed ones; names and dead links linked only where managed.
4. Dead links: only managed sources; missed queries: users see those naming an own source.
5. Nav and settings link only for admins (isAdmin in root layout data).
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
/manage/api-keys is admin-only already now: it lists every key until TASK-225 moves user keys to /account. Missed queries are filtered after the 200-row list limit; a user with few matches among many queries may see fewer than exist.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
The management area is open to every logged-in user. access.ts gains hasRoles(user, roles) (all must match) and mayManageSource (owner or admin); settings, users and the API key list stay admin-only. The source page and its save/test/sync/slug/delete actions answer 403 for a source the user does not manage; any user can create one and owns it. The overview lists readable sources, links only managed ones, and counts problems, dead links and keys only where the user can act; dead links and missed queries are filtered the same way. Tests: auth.spec and access.spec (roles and redirects), status.spec (user dashboard), sources.spec (owner/admin allowed, other user 403 on every action), dead-links.spec, missed-queries.spec. Server specs 717 passed; svelte-check clean; checked as the fixture user in the agent environment.
<!-- SECTION:FINAL_SUMMARY:END -->
