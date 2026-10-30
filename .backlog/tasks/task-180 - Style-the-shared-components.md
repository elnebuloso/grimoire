---
id: TASK-180
title: Style the shared components
status: To Do
assignee: []
created_date: '2026-10-30 18:35'
labels:
  - admin
milestone: m-0
dependencies:
  - TASK-178
references:
  - app/src/lib/components/
  - .claude/rules/ui-components.md
documentation:
  - docs/design.md
priority: medium
type: feature
ordinal: 242000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The building blocks in `app/src/lib/components/` (fields, form error, confirm and copy buttons, description list, source stats table, page list, query form, slug change form) render with browser defaults. They carry most of the UI, and their stories are the catalog and the tests of the UI, so they get the design first and in one place: each page that uses them is then styled for free.

`docs/design.md` describes each of them under Components: inputs as wells that rise on focus, raised buttons with a primary and a danger variant, the facts ledger with its numbers variant, tables with hairlines and tabular numbers, notices with a leading edge, the one-time key and copy result, code in wells.

Design source: `docs/design.md` (binding). Visual reference: mockup e/6, local and git-ignored: `cd docs/mockups && python3 -m http.server 8765`, then `http://127.0.0.1:8765/e/6/`; the bar at the bottom right switches the states of each page.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Every component in `app/src/lib/components/` matches `docs/design.md` in light and dark
- [ ] #2 Every state a component can be in has a story, including states the stories lack today (e.g. the copy result of `CopyButton`), and each story's `play` function still checks what the state shows
- [ ] #3 No component contains a raw colour value; colours come from the tokens
- [ ] #4 Every text of every story meets WCAG AA contrast in light and dark
- [ ] #5 `make test` passes
<!-- AC:END -->
