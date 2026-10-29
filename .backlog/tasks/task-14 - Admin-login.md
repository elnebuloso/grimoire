---
id: TASK-14
title: Admin login
status: Done
assignee:
  - '@claude'
created_date: '2026-10-28T19:32:00Z'
updated_date: '2026-10-29T00:34:00Z'
labels:
  - admin
milestone: m-0
dependencies:
  - TASK-1
documentation:
  - docs/concept.md
priority: high
type: feature
ordinal: 14000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The admin area manages sources with access tokens and API keys, so it must be protected. Version 1 starts with one local admin account; OAuth comes later.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 With no admin account, the admin area shows setup instead of login; setup needs the one-time setup token from the server log
- [x] #2 Login creates a session; logout ends it
- [x] #3 Every admin page and action rejects requests without a valid session
- [x] #4 Tests cover login, wrong credentials and access without a session
- [x] #5 `node scripts/reset-admin.ts` deletes the admin account and all sessions after confirming the admin username in a terminal; the next visit to the admin area offers setup with a new setup token
- [x] #6 Passwords are stored only as a scrypt hash; repeated failed logins from one client are blocked for a while
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Migration 0004-admin.sql: `admin` (single row), `admin_sessions` (token hash, expiry).
2. `app/src/lib/server/admin/auth.ts` (node:crypto only): setup with the in-memory setup token (constant-time compare, password at least 12 characters, scrypt hash), login, sessions (random token, SHA-256 stored, 12 h absolute), logout, per-IP block after 10 failures for 15 minutes.
3. Setup token created while no admin exists and logged once; after a reset the server logs `Admin account was reset`.
4. Guard in `hooks.server.ts` `handle` for `/admin/**`: no admin -> setup only; admin -> setup 404; no session -> login.
5. Routes `admin/setup`, `admin/login`, logout action, empty `admin` start page; structural markup only.
6. `scripts/reset-admin.ts` with TTY confirmation of the admin username; `make admin-reset`.
7. Handbook page `docs/handbook/admin.md`.
8. Tests, `make test`, `make lint`, built server checked with curl.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Decided with the user: no admin credentials in environment variables. On first start the admin area offers setup (username, password), secured by a one-time setup token written to the server log. A forgotten password is reset with a script in the container (`node scripts/reset-admin.ts`), not an environment variable; safeguards: confirmation of the admin username in a terminal (aborts without TTY), a warning in the server log when the admin disappears, and setup again only with a new token from the log. The real boundary is who may exec into the container.

Verified against the production build with curl: /admin -> setup without admin; wrong token 400, foreign Origin 403; setup sets the cookie (HttpOnly, SameSite=Strict, Path=/admin); /admin/setup 404 afterwards; no session -> login; logout ends the session; wrong login 400. Reset: no TTY aborts, wrong username changes nothing, right username deletes account and sessions while the server runs; the server logs `Admin account was reset.` and a new token. Found: adapter-node 6 has no ORIGIN variable and assumes https, so admin forms over plain http fail the CSRF check unless PROTOCOL_HEADER is set; documented in docs/handbook/admin.md and .claude/rules/memory.md. Guard and auth logic are tested through `adminAccessRedirect` and the auth functions in app/src/lib/server/admin/auth.spec.ts; the form actions themselves only through the built server. Not in scope: changing the password in the admin area.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
The admin area at /admin is protected by one local admin account, set up in the browser on first start with a one-time setup token from the server log (no credentials in environment variables). app/src/lib/server/admin/auth.ts: scrypt password hash, sessions with only a SHA-256 of the token stored and 12 h expiry, per-address block after 10 failed logins, guard `adminAccessRedirect` used by `handle` in hooks.server.ts; routes admin/setup, admin/login, admin/logout and an empty start page, structural markup only. Migration 0004-admin.sql. Lost password: `node scripts/reset-admin.ts` (`make admin-reset` locally) with confirmation of the username in a terminal; the server logs the reset. Handbook page docs/handbook/admin.md. make test (185 passed), make lint green, flows checked with curl against the build.
<!-- SECTION:FINAL_SUMMARY:END -->
