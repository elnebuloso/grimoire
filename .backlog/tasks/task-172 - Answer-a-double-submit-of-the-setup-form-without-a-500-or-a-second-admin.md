---
id: TASK-172
title: Answer a double submit of the setup form without a 500 or a second admin
status: To Do
assignee: []
created_date: '2026-10-30 16:13'
labels:
  - admin
milestone: m-0
dependencies: []
priority: low
type: bug
ordinal: 234000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The setup page runs without JavaScript (`csr = false`), so a double click sends two POSTs. Both pass `checkAdminAccount` (`app/src/lib/server/admin/auth.ts`) while the first is still hashing the password. With the same address the second hits `users.email UNIQUE` and gets the error page although the account was created; with two different addresses both become admins. Derived from the code, not reproduced on a running server.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 The existence of an admin is checked again inside the transaction that creates the user
- [ ] #2 A second setup submit while or after the first succeeds gets `admin-exists`, never a 500
- [ ] #3 Two concurrent setup submits with different addresses create exactly one admin, covered by a test
<!-- AC:END -->
