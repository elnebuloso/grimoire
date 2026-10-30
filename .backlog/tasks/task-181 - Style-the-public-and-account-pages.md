---
id: TASK-181
title: Style the public and account pages
status: To Do
assignee: []
created_date: '2026-10-30 18:35'
labels:
  - admin
milestone: m-0
dependencies:
  - TASK-179
  - TASK-180
references:
  - app/src/routes/+page.svelte
  - app/src/routes/setup/+page.svelte
  - app/src/routes/login/
  - app/src/routes/account/+page.svelte
  - app/src/routes/+error.svelte
documentation:
  - docs/design.md
priority: medium
type: feature
ordinal: 243000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Once the frame and the components carry the design, the pages themselves still arrange them with browser defaults: the start page, setup, login, forgot password, password reset, account and the error page. These are the pages a visitor or a new admin sees first.

`docs/design.md` gives their layout: the start page with Sources full width and "Try a query" next to "Connect an agent" on wide screens; the single-form pages in a 30rem column aligned left; status and error messages as notices with a leading edge. Every state of each page counts (e.g. reset: valid, invalid link, done; forgot: sent; login with and without the forgot link).

Design source: `docs/design.md` (binding). Visual reference: mockup e/6, local and git-ignored: `cd docs/mockups && python3 -m http.server 8765`, then `http://127.0.0.1:8765/e/6/`; the bar at the bottom right switches the states of each page.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Every state of the start, setup, login, forgot, reset, account and error pages matches `docs/design.md` in light and dark
- [ ] #2 Status and error messages use the notice shape of `docs/design.md` and keep their roles (`role="status"`, `role="alert"`)
- [ ] #3 No page scrolls horizontally at 390px or at 1366px width
- [ ] #4 Every text meets WCAG AA contrast in light and dark
- [ ] #5 `make test` and `make e2e` pass
<!-- AC:END -->
