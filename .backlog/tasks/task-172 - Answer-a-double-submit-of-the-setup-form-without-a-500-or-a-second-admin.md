---
id: TASK-172
title: Answer a double submit of the setup form without a 500 or a second admin
status: Done
assignee:
  - '@claude'
created_date: '2026-10-30 16:13'
updated_date: '2026-10-30 17:07'
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
- [x] #1 The existence of an admin is checked again inside the transaction that creates the user
- [x] #2 A second setup submit while or after the first succeeds gets `admin-exists`, never a 500
- [x] #3 Two concurrent setup submits with different addresses create exactly one admin, covered by a test
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Split the insert out of `createUser` into `insertUser`
2. `setupAdmin` hashes, then checks `adminExists` and inserts in one transaction; answers `admin-exists` when another submit won
3. Test two concurrent `setupAdmin` calls, same and different address
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Follow-up: the first version of the race test assumed the first submit wins; both password hashes run in parallel, so either may. In 10 full `make test` runs it failed 6 times. The test now accepts either winner and checks that exactly one admin exists, the winner. Green 15 times in a row; fails against the pre-fix `auth.ts`.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
`setupAdmin` (`app/src/lib/server/admin/auth.ts`) now checks again for an admin inside the transaction that inserts the user, after the password hash. A second submit that passed the first check while the first was hashing gets `admin-exists` instead of a 500 (same address) or a second admin (other address). Verified: new test with two concurrent submits fails without the change (UNIQUE error, two admins) and passes with it; admin and route tests green.
<!-- SECTION:FINAL_SUMMARY:END -->
