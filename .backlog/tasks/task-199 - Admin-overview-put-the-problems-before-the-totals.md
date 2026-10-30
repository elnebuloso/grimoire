---
id: TASK-199
title: 'Admin overview: put the problems before the totals'
status: To Do
assignee:
  - '@claude'
created_date: '2026-10-30 23:50'
labels:
  - admin
  - impeccable
dependencies:
  - TASK-197
priority: medium
type: enhancement
ordinal: 261000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The Impeccable critique of `/manage` found that the "Overview" totals ledger comes first in the source order of `app/src/routes/manage/+page.svelte`. At phone width and for screen readers "Needs attention" therefore comes second, starting at the fold below the header and the wrapped management nav; at desktop width a short attention sheet beside the tall ledger leaves an empty area. Admins come for the problems, not the totals.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 "Needs attention" comes before the totals in the source order and on narrow screens
- [ ] #2 On wide screens the layout leaves no large empty area beside or below a short attention list
- [ ] #3 The layout follows `docs/DESIGN.md` (no sheet inside a sheet, tokens only) and is checked in light and dark at phone and desktop width
- [ ] #4 Tests that walk the overview (`src/routes/manage/manage.e2e.ts`) pass
<!-- AC:END -->
