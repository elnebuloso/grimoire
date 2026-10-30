---
id: TASK-182
title: Style the management pages
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
  - app/src/routes/manage/
  - .claude/rules/ui-components.md
documentation:
  - docs/design.md
priority: medium
type: feature
ordinal: 244000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The admin area is where the developer works every day, and its pages are the densest: the overview, the source detail and new source, Try a query, Queries without results, API keys, Settings and Dead links. With the frame and the components styled, the pages still need their own arrangement from the design.

`docs/design.md` gives it: the overview with the numbers ledger next to "Needs attention" (items with an error or warning edge, nested warnings quieter) and Sources in a flush sheet below; the source page with status, history, pages and preview on the left and Settings, Change the slug and Delete in a right column; API keys with the change form in an inset well and the one-time key in a dashed well. Markup that a second page needs moves into `app/src/lib/components/` with stories, as `.claude/rules/ui-components.md` asks.

Design source: `docs/design.md` (binding). Visual reference: mockup e/6, local and git-ignored: `cd docs/mockups && python3 -m http.server 8765`, then `http://127.0.0.1:8765/e/6/`; the bar at the bottom right switches the states of each page.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Every state of every page under `/manage` matches `docs/design.md` in light and dark
- [ ] #2 Markup used by more than one page lives in `app/src/lib/components/` with stories for its states
- [ ] #3 No page scrolls horizontally at 390px or at 1366px width; wide tables scroll inside their own container
- [ ] #4 Every text meets WCAG AA contrast in light and dark
- [ ] #5 `make test` and `make e2e` pass
<!-- AC:END -->
