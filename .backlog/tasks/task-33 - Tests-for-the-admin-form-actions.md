---
id: TASK-33
title: Tests for the admin form actions
status: To Do
assignee: []
created_date: '2026-10-28T22:56:00Z'
labels:
  - admin
milestone: m-0
dependencies:
  - TASK-14
priority: medium
type: chore
ordinal: 33000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The admin login logic in `app/src/lib/server/admin/auth.ts` is unit-tested, but the form actions that wire it to HTTP (`app/src/routes/admin/setup/+page.server.ts`, `app/src/routes/admin/login/+page.server.ts`, `app/src/routes/admin/logout/+server.ts`) and the guard in `handle` (`app/src/hooks.server.ts`) were only checked by hand against the built server. A wrong cookie option, a missing redirect or a form field read under the wrong name would pass every test today. `app/src/routes/agent-api.spec.ts` shows the pattern: call the route handlers directly with a mocked `database()`.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Setup action: a valid form sets the session cookie with `httpOnly`, `sameSite: strict` and path `/admin` and redirects to `/admin`; an invalid one returns 400 with the message and keeps the username
- [ ] #2 Login action: right credentials set the cookie and redirect; wrong ones return 400 without a cookie
- [ ] #3 Logout ends the session in the database, deletes the cookie and redirects to the login
- [ ] #4 The `handle` guard redirects or answers 404 as `adminAccessRedirect` decides and leaves non-admin paths such as `/admin-tools` and the agent routes untouched
<!-- AC:END -->
