---
id: TASK-179
title: Style the page shell and layout
status: Done
assignee:
  - '@claude'
created_date: '2026-10-30 18:35'
updated_date: '2026-10-30 18:51'
labels:
  - admin
milestone: m-0
dependencies:
  - TASK-178
references:
  - app/src/routes/+layout.svelte
  - app/src/routes/manage/+layout.svelte
documentation:
  - docs/design.md
priority: medium
type: feature
ordinal: 241000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Every page shares the same frame: the header with the session links and the language switch, the management navigation on admin pages, and the page widths and section layout. Styling it once, before the pages, keeps the pages consistent and stops each one from inventing its own frame.

The frame follows `docs/design.md`: the header sits on the canvas; the language switch is a segmented track (recessed groove, chosen option raised); the management nav is the same track, larger, with the current page raised and "Change the password" set apart; content is at most 78rem wide, single-form pages use a 30rem column aligned left; sections are sheets, with two-column splits from 64rem where the design names them. TASK-50 adds the theme switch as a second segmented track next to the language switch.

Design source: `docs/design.md` (binding). Visual reference: mockup e/6, local and git-ignored: `cd docs/mockups && python3 -m http.server 8765`, then `http://127.0.0.1:8765/e/6/`; the bar at the bottom right switches the states of each page.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Header, management navigation and page frame match `docs/design.md` in light and dark
- [x] #2 The language switch is shown as a segmented track and still works without JavaScript
- [x] #3 The current page is marked in the management navigation as before (`aria-current="page"`), now also visibly
- [x] #4 No page scrolls horizontally at 390px or at 1366px width
- [x] #5 Every text of the frame meets WCAG AA contrast in light and dark
- [x] #6 `make test` and `make e2e` pass
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. `+layout.svelte`: header on the canvas (wordmark "grimoire" to `/`, session links, "Log out" as a small button), language switch as a segmented track: the existing POST form to `/language` keeps its buttons with `aria-pressed`, gains a visible label and the track look, so it works without JavaScript.
2. Wrap the page in `<main>` (max 78rem, centred, 24px gap); the layout narrows it to a 30rem column aligned left for the single-form routes (setup, login, forgot, reset, account) and the error page, so the pages need no frame of their own.
3. `manage/+layout.svelte`: the nav as the larger track, current page raised via `aria-current="page"`, "Change the password" pushed to the end; wraps below 40rem.
4. Paddings shrink below 40rem; check no horizontal scroll at 390/1366, contrast of frame texts in light and dark (axe in the browser), `make test`, `make e2e`.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
The page wrapper `<main>` now comes from the root layout; it narrows to the 30rem column by route id (setup, login, forgot, reset, account) and on `page.error`, so no page sets its own frame. The manage nav renders inside `<main>` (nested layout), visually the same as the mockup.
The language form keeps its buttons with `aria-pressed`; its name now comes from a visible label (`aria-labelledby`). Checked with JavaScript off: switching to Deutsch and back works.
Scope note: AC #4 failed on `/` and `/manage` at 390px only because the source table overflowed; `SourceStatsTable` got its `.table-scroll` wrapper here (a focusable region named "Sources", so a keyboard can scroll it; Svelte's `a11y_no_noninteractive_tabindex` is suppressed for that reason). The rest of the table styling stays in TASK-180.
Check: Playwright + axe-core (wcag2a/aa) over /, /login, /setup, /account, a 404, and every page under /manage, light and dark, 390 and 1366 px: no overflow, no violations. Known and outside this task: axe `document-title` – no page has a `<title>`.
make lint, make test (664), make e2e (18) pass.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Styled the frame of every page per `docs/design.md`: header on the canvas with wordmark, session links, small Log out button and the language switch as a segmented track (still a plain POST form, works without JavaScript); the management nav as the larger track with the current page raised (`aria-current`) and "Change the password" set apart; `<main>` max 78rem, single-form and error pages in a 30rem left column, smaller paddings below 40rem, 44px controls on touch. The source table scrolls inside its own region so nothing scrolls sideways at 390px. Verified with axe contrast and overflow checks in light and dark at 390/1366, lint, test, e2e. Follow-up candidate: pages have no `<title>` (axe `document-title`).
<!-- SECTION:FINAL_SUMMARY:END -->
