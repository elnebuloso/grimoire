---
id: TASK-300
title: Starting a provider login keeps the current session until the login succeeds
status: To Do
assignee: []
created_date: '2026-11-06 19:35'
labels:
  - admin
dependencies: []
priority: medium
type: enhancement
ordinal: 362000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
`app/src/routes/auth/oidc/[key]/+server.ts` deletes the current session before redirecting to the provider. A logged-in user who follows an invitation link and cancels at the provider is logged out with nothing gained. Decided by the owner (TASK-297, question 4): end the old session only in the callback, when the login through the provider succeeded and a new session is created.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Starting a login through a provider leaves the current session as it is
- [ ] #2 A successful login in the callback ends the previous session of the browser before creating the new one
- [ ] #3 A spec covers a cancelled login (session kept) and a successful one (old session ended)
<!-- AC:END -->
