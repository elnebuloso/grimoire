---
id: TASK-281
title: Use locals.user in the access check and the root layout
status: To Do
assignee: []
created_date: '2026-11-06 15:57'
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
- [ ] #1 `accessRedirect` takes the user instead of the cookie
- [ ] #2 The root layout load uses `locals.user`
- [ ] #3 The session is read once per request
<!-- AC:END -->
