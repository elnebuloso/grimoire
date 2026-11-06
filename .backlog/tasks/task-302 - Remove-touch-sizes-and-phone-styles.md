---
id: TASK-302
title: Remove touch sizes and phone styles
status: Done
assignee:
  - '@claude'
created_date: '2026-11-06 19:35'
updated_date: '2026-11-06 19:39'
labels: []
dependencies: []
priority: low
type: chore
ordinal: 364000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
`app/src/app.css` keeps a 44 px minimum under `pointer: coarse` and restyles below 40rem; `SegmentedSwitch.svelte` and `Toast.svelte` have phone styles too. The ui-components rule says pages are built for desktop from 1024 px and there are no touch sizes. Decided by the owner (TASK-297, question 7): remove them.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 No pointer: coarse rule and no phone breakpoint below 1024 px remains in app.css, SegmentedSwitch and Toast
- [x] #2 Pages checked at 1024 px and wider in light and dark; stories pass
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Remove the pointer: coarse blocks (app.css, SegmentedSwitch, ChoiceField) and the 40rem phone blocks (app.css h1 and sheets, SegmentedSwitch labels, Toast)
2. The 23 px h1 size, used only below 40rem, leaves the type scale
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
- ChoiceField had a touch block too, not named in the task; removed with the others.
- Checked /manage/sources (light) and /account (dark) at 1024 px; SegmentedSwitch, Toast and ChoiceField stories pass.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Touch sizes and phone styles are gone from app.css, SegmentedSwitch, Toast and ChoiceField, as the desktop-only rule says; the type scale lost the phone-only heading size. Checked at 1024 px in both schemes; stories pass.
<!-- SECTION:FINAL_SUMMARY:END -->
