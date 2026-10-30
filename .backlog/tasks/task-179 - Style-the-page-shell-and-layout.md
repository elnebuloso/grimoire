---
id: TASK-179
title: Style the page shell and layout
status: To Do
assignee: []
created_date: '2026-10-30 18:35'
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
- [ ] #1 Header, management navigation and page frame match `docs/design.md` in light and dark
- [ ] #2 The language switch is shown as a segmented track and still works without JavaScript
- [ ] #3 The current page is marked in the management navigation as before (`aria-current="page"`), now also visibly
- [ ] #4 No page scrolls horizontally at 390px or at 1366px width
- [ ] #5 Every text of the frame meets WCAG AA contrast in light and dark
- [ ] #6 `make test` and `make e2e` pass
<!-- AC:END -->
