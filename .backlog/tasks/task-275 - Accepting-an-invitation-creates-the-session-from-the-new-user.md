---
id: TASK-275
title: Accepting an invitation creates the session from the new user
status: Done
assignee:
  - '@claude'
created_date: '2026-11-06 15:56'
updated_date: '2026-11-06 16:42'
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
- [x] #1 `acceptInvitation` returns the new user ID and the route creates the session from it, without `login()`
- [x] #2 A spec shows that a client blocked by the failed-login limit still ends logged in after accepting an invitation
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Spec: a client blocked by the failed-login limit accepts an invitation and gets a session cookie (fails first)
2. acceptInvitation returns { userId }; the route creates the session from it, without login()
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
- Spec failed without the fix (no session cookie for the blocked client) and passes with it. The route no longer hashes the password a second time.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Accepting an invitation now creates the session from the new user's ID instead of logging in a second time: no second password hash, and a client blocked by the failed-login limit still ends logged in. Regression spec in invite.spec.ts.
<!-- SECTION:FINAL_SUMMARY:END -->
