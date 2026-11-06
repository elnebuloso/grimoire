---
id: TASK-275
title: Accepting an invitation creates the session from the new user
status: To Do
assignee: []
created_date: '2026-11-06 15:56'
labels:
  - admin
dependencies: []
priority: medium
type: bug
ordinal: 337000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Accepting an invitation with a password logs in a second time through `login()` (`app/src/routes/invite/[token]/+page.server.ts`). That costs a second password hash and is counted by the failed-login limit. A client that is already blocked (e.g. a shared office address after failures) gets the account created but no session: it is sent to the welcome page, bounced to the login form, and never told the invitation worked. The OIDC path creates the session from the user ID instead.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 `acceptInvitation` returns the new user ID and the route creates the session from it, without `login()`
- [ ] #2 A spec shows that a client blocked by the failed-login limit still ends logged in after accepting an invitation
<!-- AC:END -->
