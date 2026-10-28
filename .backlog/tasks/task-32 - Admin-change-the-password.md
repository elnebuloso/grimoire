---
id: TASK-32
title: 'Admin: change the password'
status: Done
assignee:
  - '@claude'
created_date: '2026-10-28T22:56:00Z'
updated_date: '2026-10-28T23:47:00Z'
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
- [x] #1 A logged-in admin can change the password in the admin area
- [x] #2 The change requires the current password; a wrong one changes nothing and counts as a failed login
- [x] #3 The new password follows the same rules as at setup (at least 12 characters) and is stored only as a scrypt hash
- [x] #4 After the change, all other sessions are ended; the current one stays logged in
- [x] #5 Tests cover the change, a wrong current password, a too short new password and the ended sessions
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. auth.ts: changePassword(db, client, session, { current, password }) - blocked clients and a wrong current password count like failed logins (shared helper with login), new password at least 12 characters, scrypt hash, then delete every session but the current one.
2. /admin/password page with current and new password, linked from /admin; success message on the same page.
3. Tests: auth.spec.ts (change, wrong current counts toward the block, too short, other sessions ended), admin.spec.ts action; e2e: change and log in with the new password.
4. Handbook admin.md.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
changePassword in app/src/lib/server/admin/auth.ts shares isBlocked/recordFailedLogin with login, so wrong current passwords and wrong logins count toward the same block per client. Hash update and deleting the other sessions run in one transaction. Page /admin/password, linked from /admin.
Verified: make test 244 passed (3 new in auth.spec.ts, 2 in admin.spec.ts), make lint clean, make e2e twice 6 passed (wrong current password, change, old password rejected, new one accepted), make handbook --strict clean.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
A logged-in admin changes the password at /admin/password. The current password is required, and a wrong one counts as a failed login; the new one needs at least 12 characters and is stored as a scrypt hash. All other sessions end, the current one stays. Handbook: admin.md 'Changing the password'.
<!-- SECTION:FINAL_SUMMARY:END -->
