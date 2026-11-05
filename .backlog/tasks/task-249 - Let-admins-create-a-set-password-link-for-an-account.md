---
id: TASK-249
title: Let admins create a set-password link for an account
status: To Do
assignee: []
created_date: '2026-11-05 20:46'
labels:
  - admin
milestone: m-3
dependencies: []
documentation:
  - docs/redesign/ux-konzept.md
priority: high
type: feature
ordinal: 311000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
An account created through single sign-on has no password. Without a password it can neither link a second provider nor unlink its only one. Without a mail server there is no way to get a password: the account page sends the user to an admin, who has no function for it, and inviting the address again is refused because the account exists. With a mail server, the account page links to `/login/forgot`, which redirects logged-in users away. Owner decision O1 in the concept: the admin creates a set-password link, mailed when a mail server is configured, otherwise shown once, like an invitation link.

Measure M2 in the concept. Work on the branch `redesign`; it ships in one merge at the end of the milestone.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 On the users page an admin can create a set-password link for an account; with a mail server it is mailed, without one it is shown once with a copy button
- [ ] #2 The link lets the account holder set a password; it expires and works once, like the reset link
- [ ] #3 The account page offers a working way to a password for an account without one: with a mail server a link to the own address, without one the hint to ask an admin, who can now act
- [ ] #4 No link on the account page leads to a page that redirects logged-in users away
- [ ] #5 Specs cover both cases (with and without mail server); the e2e flow covers creating and using the link
- [ ] #6 The handbook page for users and the admin page describe the new function
<!-- AC:END -->
