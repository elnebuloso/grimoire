---
id: TASK-66
title: 'Route structure for several roles: account pages and a neutral management area'
status: Done
assignee:
  - '@claude'
created_date: '2026-10-29 22:26'
updated_date: '2026-10-30 00:05'
labels:
  - admin
milestone: m-0
dependencies: []
priority: medium
type: enhancement
ordinal: 128000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Everything a logged-in person does lives under `/admin`: the account pages that apply to every user (`/admin/login`, `/admin/logout`, `/admin/setup`, `/admin/password`) and the management of projects, sources, API keys and settings. Since TASK-65 there are users with roles, and today only the role `admin` exists. Once a role such as an editor arrives, `/admin` no longer fits: an editor would log in at `/admin/login` and still be refused the admin area, and the header links every user to `/admin`, which answers 403 to a user without the role `admin`.

URLs are fixed once 1.0 is released (bookmarks, links in internal docs, reverse-proxy rules), so the structure changes before the release. Best done together with the task that brings user management or the first role besides `admin`, so the split follows what that role may do.

Starting point discussed with the user, to be confirmed when the work starts:

| Today | Proposal | Who |
|---|---|---|
| `/admin/login`, `/admin/logout`, `/admin/setup` | `/login`, `/logout`, `/setup` | everyone |
| `/admin/password` | `/account` | every logged-in user |
| `/admin/projects/…` | `/manage/projects/…` | roles that manage content |
| `/admin/api-keys`, `/admin/settings`, users | `/manage/api-keys`, `/manage/settings`, `/manage/users` | `admin` only |

One shared, neutrally named area rather than one area per role: a user with several roles sees one area, and each page checks the role it needs.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Login, logout and setup are reachable outside the management area, for every user
- [x] #2 A logged-in user reaches their own account page (today the password change) whatever roles they hold
- [x] #3 The management area has a name that does not tie it to one role, and every page in it requires the role it needs, checked per request
- [x] #4 The header links a logged-in user only to pages they may open; nobody is led to a 403 from the navigation
- [x] #5 Tests, e2e tests, `docs/handbook/` and `.claude/rules/agent-environment.md` use the new URLs
- [x] #6 Done before the release of 1.0
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Name confirmed with the user: /manage for the management area; /login, /logout, /setup and /account outside it.
2. Move the route directories; replace URL paths in code, tests, scripts, handbook and README (module paths under lib/server/admin stay).
3. auth.ts: accessRedirect for every path with PAGE_ROLES (prefix to role, today /manage needs admin) and ACCOUNT_PAGES; mayOpen and homeOf; the hook guards account and role pages only, everything else is served.
4. Header: name links to /account, Manage only for users who may open it; login sends a user to homeOf.
5. Rename 'admin area' to 'management area' in handbook, README, navigation and UI texts; tests and e2e.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Old /admin URLs answer 404, no redirects: nothing depends on them before 1.0 (redirect criterion removed when the task was created). .claude/rules/agent-environment.md names no URLs, so it needed no change. The comments in migrations 0004 and 0008 still say 'admin area'; released migrations are not edited.
Verified: make lint, make test (452), make e2e (15), make handbook; by hand without JavaScript in the agent environment: /manage logged out goes to /login, after login /manage with the heading 'Manage grimoire', header links agent=/account and Manage=/manage, /account opens, /admin and /admin/... answer 404.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
The account pages sit outside the management area: /login, /logout, /setup and /account (the password change, open to every logged-in user). The management area moved from /admin to /manage; which role a page needs is decided per request from a prefix table in auth.ts (today /manage needs admin), and the header links a user only to pages they may open: their name to /account, Manage only with the role. After login a user lands in /manage or, without the role, on the start page. 'Admin area' is called 'management area' in the handbook, README, navigation and UI. Tests, e2e and the handbook use the new URLs; the old ones answer 404.
<!-- SECTION:FINAL_SUMMARY:END -->
