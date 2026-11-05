---
id: TASK-245
title: Link and unlink providers on the account page; admins see and remove links
status: To Do
assignee:
  - '@claude'
created_date: '2026-11-05 17:04'
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
- [ ] #1 A logged-in user links a provider on `/account` after entering the current password; an identity linked to another user is refused
- [ ] #2 A user unlinks a provider only while a password or another configured provider remains; unlinking ends the other sessions
- [ ] #3 `/manage/users` shows how each user logs in, and an admin removes a link, which ends that user's sessions
<!-- AC:END -->
