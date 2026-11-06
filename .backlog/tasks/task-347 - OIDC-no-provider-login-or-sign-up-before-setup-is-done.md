---
id: TASK-347
title: 'OIDC: no provider login or sign-up before setup is done'
status: To Do
assignee: []
created_date: '2026-11-06 23:46'
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
- [ ] #1 Starting a provider login while no admin exists redirects to `/setup` and sets no flow cookie
- [ ] #2 With an admin, provider logins work as before
- [ ] #3 A spec in `start.spec.ts` (or the route's spec) covers both
<!-- AC:END -->
