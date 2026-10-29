---
id: TASK-65
title: Data model for several users with roles
status: To Do
assignee: []
created_date: '2026-10-29 22:06'
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
- [ ] #1 Accounts are stored as users, any number of them, each with a unique username and its own password hash; the single-row `admin` table is gone
- [ ] #2 A user has any number of roles, stored as one entry per user and role; the roles that exist are defined in the code, and today there is one, `admin`
- [ ] #3 Every session belongs to one user; logging out, changing the password and an expired session affect only that user's sessions
- [ ] #4 The admin area requires a session of a user with the role `admin`; a logged-in user without it gets no access
- [ ] #5 The setup on first start creates the first user with the role `admin`; while no user with that role exists, the setup stays reachable as today
- [ ] #6 `scripts/reset-admin.ts` still recovers a lost admin password, now for the named user, and the agent environment fixture user `agent` has the role `admin`
- [ ] #7 For the one admin, setup, login, logout, password change and the login block after failed attempts behave as before
- [ ] #8 Tests cover several users with different roles, sessions per user, access refused without the role `admin`, and the setup while no admin exists
- [ ] #9 The decision on how users and roles are stored is recorded as an ADR, and `docs/handbook/admin.md` describes accounts and roles as they are now
<!-- AC:END -->
