---
id: TASK-199
title: 'Admin overview: put the problems before the totals'
status: Done
assignee:
  - '@claude'
created_date: '2026-10-30 23:50'
updated_date: '2026-10-31 00:04'
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

Carried out by running `/impeccable layout /manage` (Impeccable skill), as the Action Summary of the critique recommends; the command's playbook governs the design work, this task's acceptance criteria decide when it is done.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 "Needs attention" comes before the totals in the source order and on narrow screens
- [x] #2 On wide screens the layout leaves no large empty area beside or below a short attention list
- [x] #3 The layout follows `docs/DESIGN.md` (no sheet inside a sheet, tokens only) and is checked in light and dark at phone and desktop width
- [x] #4 Tests that walk the overview (`src/routes/manage/manage.e2e.ts`) pass
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Move the "Needs attention" sheet before the "Overview" ledger in `app/src/routes/manage/+page.svelte`.
2. Wide screens: attention takes the flexible column, the ledger the fixed 19rem column on the right, and both sheets stretch to one height, so a short list leaves no hole on the canvas.
3. Narrow screens: attention, totals, sources in source order.
4. Check at 1280 and 375 px in light and dark, run `impeccable detect --scope layout` and `manage.e2e.ts`.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Ran the layout assessment inline before the mechanical scan instead of in two sub-agents: one file, one structural change. Measured in the agent environment: at 1280 px both sheets start at the same top and are 327 px tall each; at 375 px attention starts at 473 px, the ledger at 894 px, no horizontal page scroll (scrollWidth 375). `impeccable detect --json --scope layout` on the page: `[]`. `manage.e2e.ts`: 17 passed. When every source is fine, the attention sheet holds one sentence and stretches to the height of the ledger: empty space inside the sheet, not a hole on the canvas.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
"Needs attention" now comes first on `/manage`: first in source order, so first on phones and for screen readers, and in the wide column on desktop with the totals ledger to its right. Both sheets stretch to one height, removing the empty area that a short list left beside the tall ledger. Checked in light and dark at phone and desktop width; layout scan clean, manage e2e passing.
<!-- SECTION:FINAL_SUMMARY:END -->
