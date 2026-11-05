---
id: TASK-245
title: Link and unlink providers on the account page; admins see and remove links
status: Done
assignee:
  - '@claude'
created_date: '2026-11-05 17:04'
updated_date: '2026-11-05 17:28'
labels:
  - admin
dependencies:
  - TASK-244
priority: high
type: feature
ordinal: 307000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Rebuilt from the SSO milestone in ../grimoire-before-reset (see TODO-UEBERNAHME.md there, point 3), which was reverted with the reset of main; the old code is a reference, not a template. Rights stay as they are: SSO decides only who logs in.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 A logged-in user links a provider on `/account` after entering the current password; an identity linked to another user is refused
- [x] #2 A user unlinks a provider only while a password or another configured provider remains; unlinking ends the other sessions
- [x] #3 `/manage/users` shows how each user logs in, and an admin removes a link, which ends that user's sessions
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Account page from the old state: title "Account" with sections for the password and the providers; the management nav names it Account. checkCurrentPassword split out of changePassword for linking. Users page shows the sign-in methods and removes a link (old 2615b2a), using describeLinks.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Users link a provider on /account after confirming their password and unlink it while another way in remains, which ends their other sessions; admins see on /manage/users how each user logs in and remove a link. Verified: make lint, make test (984), make e2e (28, including linking, logging in elsewhere through the link, unlinking and the admin removing a link).
<!-- SECTION:FINAL_SUMMARY:END -->
