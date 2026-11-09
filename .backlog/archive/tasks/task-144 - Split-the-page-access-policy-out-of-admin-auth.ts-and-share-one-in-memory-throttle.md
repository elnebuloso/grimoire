---
id: TASK-144
title: >-
  Split the page access policy out of admin/auth.ts and share one in-memory
  throttle
status: Done
assignee:
  - '@claude'
created_date: '2026-10-30 11:29'
updated_date: '2026-10-30 11:55'
labels:
  - admin
milestone: m-0
dependencies: []
priority: low
type: chore
ordinal: 206000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Found in the second whole-project code review of 2026-10-30; to be done when the work on more users and roles (docs/decisions/0003-users-with-roles.md) starts, not before, since nothing is broken today. `app/src/lib/server/admin/auth.ts` (379 lines) holds five concerns: password hashing (with the global hashing limiter), per-client login throttling as module state (`failedLogins`, `MAX_FAILED_LOGINS`, `BLOCK_MINUTES`), sessions, the setup token and the "admin was reset" detection as module state, and the page-role access policy (`PAGE_ROLES`, `ACCOUNT_PAGES`, `mayOpen`, `homeOf`, `accessRedirect`, used by `app/src/hooks.server.ts`, `app/src/routes/+layout.server.ts` and `app/src/routes/login/+page.server.ts`). A change to who may open which page means editing the file that also holds the crypto. `app/src/lib/server/admin/password-reset.ts` (`withinLimit`, `recentRequests`) solves the same problem as the login throttle - count requests per key in memory and forget them after a while - in a different way: a sliding window of timestamps over 60 minutes versus a count with a 15-minute block, each with its own sweep and its own `ponytail:` note about several instances. A per-account login limit, which more users make likely, would become a third copy. `auth.ts` is also loaded with plain node by `scripts/reset-admin.ts`, so it and everything it imports use relative imports with `.ts` extensions and nothing Vite resolves.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 The page access policy (`PAGE_ROLES`, `ACCOUNT_PAGES`, `mayOpen`, `homeOf`, `accessRedirect`) lives in its own module under `app/src/lib/server/admin/`; `auth.ts` keeps hashing, sessions, setup and login
- [x] #2 Login throttling and the password reset request limit use one shared helper (key, limit, window) instead of two implementations, with their current limits unchanged
- [x] #3 Existing auth, password reset and route specs pass unchanged in what they assert; `scripts/reset-admin.ts` still runs with plain node
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. New admin/access.ts with PAGE_ROLES, ACCOUNT_PAGES, isUnder, mayOpen, homeOf, accessRedirect (moved unchanged); hooks.server.ts, +layout.server.ts and login/+page.server.ts import from it.
2. New admin/attempt-limit.ts: createAttemptLimit(max, windowMinutes) with take(key, now) and forget(key), the sliding window password-reset.ts used.
3. Login and password change use one limit (10 in 15 minutes) instead of count-then-block; reset requests use two limits (5 per client, 3 per address, 60 minutes).
4. auth.spec calls the access functions from the new module; assertions unchanged.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Behaviour difference of the login limit: before, the 10th failure blocked the client for 15 minutes from that failure; now the client is refused until the oldest of its last 10 failures is 15 minutes old. The rate stays at most 10 attempts per 15 minutes; for failures sent in a burst (the attack case) it is the same. All existing auth tests pass unchanged.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
The page access policy (PAGE_ROLES, ACCOUNT_PAGES, mayOpen, homeOf, accessRedirect) moved unchanged from admin/auth.ts into admin/access.ts; auth.ts (now 306 lines) keeps hashing, sessions, setup and login. Login throttling and the reset request limits share createAttemptLimit in admin/attempt-limit.ts, a sliding window per key with the same numbers as before (10 failed logins in 15 minutes; 5 reset requests per client and 3 per address in 60 minutes). The login block now ends 15 minutes after the oldest of the last 10 failures rather than after the 10th; the rate cap is unchanged. All 257 admin and route specs pass with unchanged assertions (auth.spec only calls the access functions from the new module); eslint passes; auth.ts still loads with plain node for scripts/reset-admin.ts.
<!-- SECTION:FINAL_SUMMARY:END -->
