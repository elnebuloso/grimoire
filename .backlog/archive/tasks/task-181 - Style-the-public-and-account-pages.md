---
id: TASK-181
title: Style the public and account pages
status: Done
assignee:
  - '@claude'
created_date: '2026-10-30 18:35'
updated_date: '2026-10-30 19:14'
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
- [x] #1 Every state of the start, setup, login, forgot, reset, account and error pages matches `docs/design.md` in light and dark
- [x] #2 Status and error messages use the notice shape of `docs/design.md` and keep their roles (`role="status"`, `role="alert"`)
- [x] #3 No page scrolls horizontally at 390px or at 1366px width
- [x] #4 Every text meets WCAG AA contrast in light and dark
- [x] #5 `make test` and `make e2e` pass
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. New component `PageHead` (h1, optional back link above, optional lead below in `--ink-2`), with stories: every page under this task and TASK-182 has the same head, so it is shared markup.
2. Start page: hero with the large h1 and the GitHub link; Sources in a flush sheet (empty line padded); "Try a query" and "Connect an agent" as sheets side by side from 64rem.
3. Setup, login, forgot, reset, account: head + one sheet with the form, primary submit, setup token in mono; status and alert texts as `.notice` (keeping `role`); the forgot link below a hairline in the login sheet; reset invalid/done and forgot sent as notices with the follow-up link.
4. Error page: one sheet with the h1 and the link to the start page.
5. Global: padding of a flush sheet's parts after the head.
6. Verify every state in light and dark at 390/1366 (overflow + axe), `make test`, `make e2e`.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
New component `PageHead` (title, optional `back` link, lead as children) with stories "Title only", "With a lead", "With a way back"; TASK-182 reuses it. Its `back.href` needs an eslint directive (`svelte/no-navigation-without-resolve`): the caller passes a resolved path.
The single-form sheets carry no accessible name: an `aria-label` repeating the title made a region that also matched `getByLabel('Password')` in the e2e reset test, and only repeated the h1 for screen readers.
Links after a status ("Log in", "Request a new link", "To the start page") stay plain links; `docs/design.md` names no link-as-button.
Global: the parts of a flush sheet after its head get no top padding.
Checked every state with Playwright + axe (wcag2a/aa), light and dark, 390 and 1366: start (agent env, with query form), login without/with forgot link, login error, forgot, forgot sent, reset invalid, reset form, reset error, reset done, setup, setup error, account, 404. Setup, forgot link and the reset flow on a throwaway production build (port 4199, empty DB, mailpit for the reset mail). No overflow, no violations.
make lint, make test (670), make e2e (18) pass.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Arranged the start, setup, login, forgot, reset, account and error pages per `docs/design.md`: a shared `PageHead` (new component with stories), single forms in one sheet in the narrow column with primary submit, status and errors as notices that keep `role=status`/`role=alert`, the start page with a hero, Sources in a flush sheet and "Try a query" next to "Connect an agent" from 64rem, the error page as one sheet. Every state checked in light and dark at 390/1366 with axe and for overflow; lint, test and e2e green.
<!-- SECTION:FINAL_SUMMARY:END -->
