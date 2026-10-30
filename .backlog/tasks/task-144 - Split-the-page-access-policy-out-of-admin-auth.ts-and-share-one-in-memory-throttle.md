---
id: TASK-144
title: >-
  Split the page access policy out of admin/auth.ts and share one in-memory
  throttle
status: To Do
assignee: []
created_date: '2026-10-30 11:29'
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
- [ ] #1 The page access policy (`PAGE_ROLES`, `ACCOUNT_PAGES`, `mayOpen`, `homeOf`, `accessRedirect`) lives in its own module under `app/src/lib/server/admin/`; `auth.ts` keeps hashing, sessions, setup and login
- [ ] #2 Login throttling and the password reset request limit use one shared helper (key, limit, window) instead of two implementations, with their current limits unchanged
- [ ] #3 Existing auth, password reset and route specs pass unchanged in what they assert; `scripts/reset-admin.ts` still runs with plain node
<!-- AC:END -->
