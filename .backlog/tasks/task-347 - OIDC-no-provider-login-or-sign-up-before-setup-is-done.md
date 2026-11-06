---
id: TASK-347
title: 'OIDC: no provider login or sign-up before setup is done'
status: Done
assignee:
  - '@claude'
created_date: '2026-11-06 23:46'
updated_date: '2026-11-06 23:57'
labels:
  - admin
dependencies: []
references:
  - 'app/src/routes/auth/oidc/[key]/+server.ts'
  - app/src/lib/server/auth/access.ts
priority: medium
type: bug
ordinal: 409000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
While no account has the role `admin`, `/login` redirects to `/setup` (`app/src/lib/server/auth/access.ts`, `checkAdminAccount` in `app/src/lib/server/auth/auth.ts`). The provider login start `POST /auth/oidc/[key]` (`app/src/routes/auth/oidc/[key]/+server.ts`) and its callback are neither guarded nor account pages, so they run before setup. The callback's create branch (`app/src/routes/auth/oidc/[key]/callback/+page.server.ts`, around lines 129-135) creates an account for a verified address in an allowed domain.

Case: an operator moves an instance; the new one starts empty with the same `OIDC_*` settings. Before the import, a colleague clicks "Log in with GitLab" on a login page still open in a browser. The callback creates an account; the setup import then answers `instance-not-empty` (`app/src/lib/server/instance-import.ts`), and no page can delete that account – only wiping the database helps. If the colleague is the operator, the setup "create" form also refuses their address with `account-exists`.

Suggested fix: at the top of the start POST, `if (!checkAdminAccount(database())) redirect(303, '/setup');` – the same rule `/login` follows. The callback cannot run without the flow cookie the start sets.

Found by the third whole-repo audit on 2026-11-07 (HEAD 4a72798).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Starting a provider login while no admin exists redirects to `/setup` and sets no flow cookie
- [x] #2 With an admin, provider logins work as before
- [x] #3 A spec in `start.spec.ts` (or the route's spec) covers both
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Spec in start.spec.ts: without an admin the start redirects to /setup and starts no flow
2. POST /auth/oidc/[key] checks checkAdminAccount(database()) first, as /login does
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
- The spec failed before and passes after; OIDC route specs and access.spec pass (47 tests). With an admin the existing start specs pass unchanged.
- checkAdminAccount also logs the setup token while none exists, as /login does.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Starting a login at an identity provider now leads to /setup while no admin exists, as /login does, so a provider sign-up can no longer create an account on an empty instance and make its setup import refuse with "instance not empty". Covered by a spec in start.spec.ts.
<!-- SECTION:FINAL_SUMMARY:END -->
