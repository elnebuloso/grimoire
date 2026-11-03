---
id: TASK-227
title: Invite users by email
status: To Do
assignee: []
created_date: '2026-11-03 00:30'
labels:
  - admin
milestone: m-2
dependencies:
  - TASK-221
references:
  - app/src/lib/server/admin/password-reset.ts
  - app/src/routes/setup/
  - app/src/lib/server/mail/index.ts
priority: high
type: feature
ordinal: 289000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
New users can only come from the setup today, which creates the first admin. Admins are to add more people. A link must work only for the address it was sent to and only once; anyone who holds the mail can use it, so it expires and can be replaced. SMTP is optional on an instance.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 An admin invites an email address; an address that already has an account or a pending invite is refused with a message
- [ ] #2 The invite goes out by mail; without SMTP the admin is shown the link once to copy
- [ ] #3 The link opens a form with the fields of the setup form, the email address fixed; setting a password creates a user without roles and logs them in
- [ ] #4 The link works once and for 7 days; a used, expired, replaced or revoked link is refused with a message
- [ ] #5 Only a hash of the token is stored, like password reset links; two submits of the same link create one user
- [ ] #6 Tests cover each refusal and the double submit
<!-- AC:END -->
