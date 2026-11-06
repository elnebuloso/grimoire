---
id: TASK-300
title: Starting a provider login keeps the current session until the login succeeds
status: Done
assignee:
  - '@claude'
created_date: '2026-11-06 19:35'
updated_date: '2026-11-06 19:41'
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
- [x] #1 Starting a login through a provider leaves the current session as it is
- [x] #2 A successful login in the callback ends the previous session of the browser before creating the new one
- [x] #3 A spec covers a cancelled login (session kept) and a successful one (old session ended)
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. The start endpoint no longer deletes the session; it hands the hash of the current session to the flow (OidcFlow.replaces), as the link flow does with its own
2. The callback ends that session right before it creates the new one, only on a successful login
3. Specs: start keeps the cookie and passes the hash; callback ends the session on success and keeps it on a cancel
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
- The strict session cookie does not arrive at the callback (a request from the provider's site), so the callback cannot read the old session itself; the sealed flow carries its hash instead.
- Both new specs failed before the change; auth route and OIDC specs pass.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Starting a login through a provider keeps the current session; the flow remembers its hash, and the callback ends it only once the provider login succeeded and the new session is created. Cancelling at the provider no longer logs the user out. Specs cover the start, a successful login and a cancel.
<!-- SECTION:FINAL_SUMMARY:END -->
