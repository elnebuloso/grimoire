---
id: TASK-224
title: 'Open the management area to users, limited by role and ownership'
status: To Do
assignee: []
created_date: '2026-11-03 00:29'
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
- [ ] #1 Every logged-in user may open the management area; settings and the user management need `admin`
- [ ] #2 Changing, deleting, syncing, renaming or changing the visibility of a source is allowed to its owner and to admins; anyone else gets 403
- [ ] #3 Users see in the overview the sources they may read, admins every source
- [ ] #4 Dead links and missed queries show a user only their own sources, an admin all
- [ ] #5 `hasRoles` is true only when the user holds every role given
- [ ] #6 Route specs cover owner, other user and admin for every source action
<!-- AC:END -->
