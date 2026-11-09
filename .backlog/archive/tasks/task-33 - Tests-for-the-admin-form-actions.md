---
id: TASK-33
title: Tests for the admin form actions
status: Done
assignee:
  - '@claude'
created_date: '2026-10-28T22:56:00Z'
updated_date: '2026-10-28T23:05:00Z'
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
- [x] #1 Setup action: a valid form sets the session cookie with `httpOnly`, `sameSite: strict` and path `/admin` and redirects to `/admin`; an invalid one returns 400 with the message and keeps the username
- [x] #2 Login action: right credentials set the cookie and redirect; wrong ones return 400 without a cookie
- [x] #3 Logout ends the session in the database, deletes the cookie and redirects to the login
- [x] #4 The `handle` guard redirects or answers 404 as `adminAccessRedirect` decides and leaves non-admin paths such as `/admin-tools` and the agent routes untouched
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. `app/src/routes/admin/admin.spec.ts` in the existing Vitest `server` project, no sv add-on (decided with the user). Pattern from `agent-api.spec.ts`: route handlers called directly, `database()` mocked to an in-memory db; fresh module state per test via `vi.resetModules()`.
2. Fake `cookies` recording the options; thrown redirects and errors checked with `isRedirect`/`isHttpError`.
3. Cases: setup action, login action, logout endpoint, `handle` guard incl. paths it must not touch.
4. Check that the tests turn red for a wrong cookie option and a too broad guard path.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Decided with the user: no sv add-on for this task; Playwright end-to-end tests become their own task after TASK-15, Storybook waits for the design phase.

Vitest can mock the virtual `$app/env/private`, so `hooks.server.ts` is tested as is, without moving `handle` out. Checked that the tests catch real breakage: `sameSite: lax` in the cookie options (3 tests red), the guard matching `/admin*` instead of `/admin` and `/admin/` (1 red, via `/admin-tools`), and the login action reading the wrong form field (2 red).
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Added `app/src/routes/admin/admin.spec.ts` (8 tests) in the existing Vitest server project, no sv add-on: setup and login actions (cookie name and options httpOnly, sameSite strict, path /admin; 303 redirects; 400 with message and kept username, no cookie), logout (session row deleted, cookie deleted, redirect to login) and the `handle` guard (setup while no admin, 404 for setup afterwards, login without session, paths like /admin-tools and /mcp untouched). Route handlers are called directly with an in-memory database and a recording fake for cookies; module state is reset per test. make test (193 passed) and make lint green; mutation checks confirmed the tests fail for a wrong cookie option, a too broad guard and a wrong form field. Follow-up: Playwright end-to-end tests in TASK-34.
<!-- SECTION:FINAL_SUMMARY:END -->
