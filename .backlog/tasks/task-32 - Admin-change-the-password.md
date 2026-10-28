---
id: TASK-32
title: 'Admin: change the password'
status: To Do
assignee: []
created_date: '2026-10-28T22:56:00Z'
labels:
  - admin
milestone: m-0
dependencies:
  - TASK-14
priority: medium
type: feature
ordinal: 32000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The admin account is set up in the browser on first start; afterwards its password can only be replaced by deleting the account with `node scripts/reset-admin.ts` and setting it up again. That is meant for a lost password, not for routine changes, and it needs exec access to the container. A logged-in admin should be able to change the password in the admin area.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 A logged-in admin can change the password in the admin area
- [ ] #2 The change requires the current password; a wrong one changes nothing and counts as a failed login
- [ ] #3 The new password follows the same rules as at setup (at least 12 characters) and is stored only as a scrypt hash
- [ ] #4 After the change, all other sessions are ended; the current one stays logged in
- [ ] #5 Tests cover the change, a wrong current password, a too short new password and the ended sessions
<!-- AC:END -->
