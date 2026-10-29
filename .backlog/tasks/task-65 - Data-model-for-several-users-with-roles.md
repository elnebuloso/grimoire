---
id: TASK-65
title: Data model for several users with roles
status: Done
assignee:
  - '@claude'
created_date: '2026-10-29 22:06'
updated_date: '2026-10-29 22:22'
labels:
  - admin
milestone: m-0
dependencies: []
priority: medium
type: feature
ordinal: 127000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
grimoire has exactly one local admin account: the table `admin` allows a single row (`CHECK (id = 1)`, migration `0004-admin.sql`), and sessions in `admin_sessions` belong to no one in particular. Later, further users are to be added who manage data in the app, and a user can hold several roles. Adding users and managing roles in the UI is not part of this task; the data model and the authentication around it have to support it now, so the later feature adds users and roles without changing how accounts, sessions and access are stored. The schema is still free to change before the release, as all migrations are merged into one `0001` at the end of the milestone (TASK-29).

Decided with the user: primary keys stay integers. Access is protected by checking the logged-in user and their roles on every request, not by unguessable IDs.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Accounts are stored as users, any number of them, each with a unique username and its own password hash; the single-row `admin` table is gone
- [x] #2 A user has any number of roles, stored as one entry per user and role; the roles that exist are defined in the code, and today there is one, `admin`
- [x] #3 Every session belongs to one user; logging out, changing the password and an expired session affect only that user's sessions
- [x] #4 The admin area requires a session of a user with the role `admin`; a logged-in user without it gets no access
- [x] #5 The setup on first start creates the first user with the role `admin`; while no user with that role exists, the setup stays reachable as today
- [x] #6 `scripts/reset-admin.ts` still recovers a lost admin password, now for the named user, and the agent environment fixture user `agent` has the role `admin`
- [x] #7 For the one admin, setup, login, logout, password change and the login block after failed attempts behave as before
- [x] #8 Tests cover several users with different roles, sessions per user, access refused without the role `admin`, and the setup while no admin exists
- [x] #9 The decision on how users and roles are stored is recorded as an ADR, and `docs/handbook/admin.md` describes accounts and roles as they are now
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Migration 0010-users.sql: users (id, username UNIQUE, password_hash), user_roles (user_id, role CHECK in the known roles, PRIMARY KEY (user_id, role)), sessions (token_hash, user_id, expires_at); copies the admin as first user with role admin and its sessions; drops admin and admin_sessions.
2. auth.ts: ROLES = ['admin'] in code; an admin exists when any user has the role admin (drives setup token and 'Admin account was reset.'); setup inserts user and role; login looks the user up by name and still runs scrypt for an unknown name, so timing tells nothing; sessions carry the user; sessionUser(db, token) returns id, username and roles; changePassword and logout touch only that user's sessions; resetAdmin deletes the named user with role admin and its sessions with explicit deletes (the reset script opens the file without foreign keys).
3. adminAccessRedirect: no session -> login; a session without role admin -> 403, except logout and login (to switch user); the layout shows the logged-in user.
4. agent-seed.ts creates the user agent with role admin; schema test lists the new tables.
5. Tests in auth.spec.ts and admin.spec.ts for several users, roles, per-user sessions and setup; ADR 0003 on storing users and roles; handbook admin.md.

6. Found by hand: the login sent every user to /admin, so a user without the role admin landed on a bare 403 page; the login now sends them to the start page.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Migration 0010 copies the existing admin to users with role admin and keeps their sessions (tested in migrate.spec.ts, and by hand on the agent environment's old database: user_version 9 to 10, login as agent works). Roles are a CHECK in the schema and ROLES in auth.ts. createUser serves the setup and the tests; there is no UI to add users yet. login compares against a throwaway hash for an unknown username, so its timing does not reveal which usernames exist. resetAdmin deletes rows one by one, because scripts/reset-admin.ts opens the file without foreign keys.
Verified: make lint, make test (424), make e2e (15), make handbook. By hand in the agent environment without JavaScript: a user editor without roles logs in, lands on the start page shown as logged in, gets 403 in the admin area, can open the login page and log out; scripts/reset-admin.ts in a terminal deleted agent, kept editor, and the server logged 'Admin account was reset.' with a new setup token and redirected /admin to the setup.
Follow-up for the user management feature: the header links the username to /admin, which a user without the role admin cannot open.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Accounts are users now: any number of them, each with a unique username, a password hash and any number of roles (one row per user and role; the roles are defined in code and checked by the schema, today only admin). Sessions belong to a user, so logout and a password change touch only that user's sessions. The admin area requires the role admin per request; a user without it gets 403 there, can log in and out, and is sent to the start page after login. The setup stays reachable while no user has the role admin, and scripts/reset-admin.ts deletes a named admin. Migration 0010 turns the existing admin into the first user with role admin, sessions included; the agent fixture user agent has the role. No UI to add users yet; that is the later feature this prepares.

Decision recorded as docs/decisions/0003-users-with-roles.md (Proposed); docs/handbook/admin.md describes users and roles. Covered by unit, route, migration and e2e tests and checked by hand.
<!-- SECTION:FINAL_SUMMARY:END -->
