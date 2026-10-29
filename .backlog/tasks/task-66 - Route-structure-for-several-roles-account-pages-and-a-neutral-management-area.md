---
id: TASK-66
title: 'Route structure for several roles: account pages and a neutral management area'
status: To Do
assignee: []
created_date: '2026-10-29 22:26'
updated_date: '2026-10-29 22:26'
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
- [ ] #1 Login, logout and setup are reachable outside the management area, for every user
- [ ] #2 A logged-in user reaches their own account page (today the password change) whatever roles they hold
- [ ] #3 The management area has a name that does not tie it to one role, and every page in it requires the role it needs, checked per request
- [ ] #4 The header links a logged-in user only to pages they may open; nobody is led to a 403 from the navigation
- [ ] #5 Tests, e2e tests, `docs/handbook/` and `.claude/rules/agent-environment.md` use the new URLs
- [ ] #6 Done before the release of 1.0
<!-- AC:END -->
