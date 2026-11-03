---
id: TASK-228
title: User management page
status: Done
assignee:
  - '@claude'
created_date: '2026-11-03 00:30'
updated_date: '2026-11-03 01:15'
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
- [x] #1 Admins see all users with their roles and all pending invites with the time each was sent
- [x] #2 A pending invite can be sent again, which replaces its link and updates the time sent, or revoked
- [x] #3 An admin makes a user an admin or takes the role away
- [x] #4 Deleting a user hands their sources to the deleting admin, revokes their keys and ends their sessions
- [x] #5 The last admin cannot be deleted or lose the role, and an admin cannot delete themselves
- [x] #6 An e2e test walks invite, accepting it, creating an own source and key, and being refused on another user's source
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. users.ts: listUsers, setAdmin (never from the last admin), deleteUser (sources to the deleting admin; keys, counts, sessions cascade; never self or last admin).
2. /manage/users: users table with role, Make admin / Remove admin role / Delete (confirmed), pending invitations with send time, expired marker, Send again / Withdraw.
3. Specs for module and route; e2e flow in manage.e2e.ts; look in light and dark.
<!-- SECTION:PLAN:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
The admin-only /manage/users page lists every user with their role and every pending invitation with the time it was sent (and whether it expired). Invitations can be sent again (new link, old one void, time updated) or withdrawn; users can be made admin or lose the role, and deleted: their sources pass to the deleting admin, their keys (with their request counts), sessions and reset links go with them. The last admin keeps the role and cannot be deleted; nobody deletes their own account. Tests: users.spec (module), manage/users/users.spec.ts (actions and refusals), and a new step in manage.e2e.ts: invite by mail, accept, writer sees neither the admin's private source nor its page (403), creates an own source and key that reads only it, admin deletes the writer, key stops working and the source shows on the admin's overview. make e2e for manage.e2e.ts: 17 passed. Page checked in light and dark.
<!-- SECTION:FINAL_SUMMARY:END -->
