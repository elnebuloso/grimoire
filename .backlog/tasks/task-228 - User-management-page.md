---
id: TASK-228
title: User management page
status: To Do
assignee: []
created_date: '2026-11-03 00:30'
labels:
  - admin
milestone: m-2
dependencies:
  - TASK-224
  - TASK-225
  - TASK-227
priority: high
type: feature
ordinal: 290000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Once users can be invited, admins need one place to see who has access, follow up on invites nobody accepted, and remove or promote people. Losing the last admin reopens the setup, so it must not happen by accident.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Admins see all users with their roles and all pending invites with the time each was sent
- [ ] #2 A pending invite can be sent again, which replaces its link and updates the time sent, or revoked
- [ ] #3 An admin makes a user an admin or takes the role away
- [ ] #4 Deleting a user hands their sources to the deleting admin, revokes their keys and ends their sessions
- [ ] #5 The last admin cannot be deleted or lose the role, and an admin cannot delete themselves
- [ ] #6 An e2e test walks invite, accepting it, creating an own source and key, and being refused on another user's source
<!-- AC:END -->
