---
id: TASK-281
title: Use locals.user in the access check and the root layout
status: Done
assignee:
  - '@claude'
created_date: '2026-11-06 15:57'
updated_date: '2026-11-06 16:47'
labels:
  - admin
dependencies: []
priority: medium
type: task
ordinal: 343000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
`handleAccess` reads `sessionUser` into `locals.user` (`app/src/hooks.server.ts`). `accessRedirect` reads it again from the cookie (`app/src/lib/server/admin/access.ts`), and the root layout load reads it a third time and ignores `locals.user` (`app/src/routes/+layout.server.ts`). "Logged in" therefore has two definitions: a future change to `locals.user` (refusing disabled accounts, per-request expiry) would not reach the header or the "Manage" link, and a page could show a user as logged in and managing while the guard already denied them.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 `accessRedirect` takes the user instead of the cookie
- [x] #2 The root layout load uses `locals.user`
- [x] #3 The session is read once per request
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. handleAccess reads the session user once into locals.user, for every request (route or not)
2. accessRedirect takes the user instead of the cookie
3. The root layout load uses locals.user
4. Specs: access specs pass users; a request to an unknown route still gets locals.user
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
- locals.user is now set before the unknown-route early return, so the root layout of an error page for a missing route still shows the logged-in header (it read the cookie itself before).
- Full make test green (hooks.server.ts and root layout touched).
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
The session is read once per request in handleAccess; accessRedirect takes that user and the root layout load uses locals.user, so 'logged in' has one definition. Specs updated and one added for a missing route; full make test green.
<!-- SECTION:FINAL_SUMMARY:END -->
