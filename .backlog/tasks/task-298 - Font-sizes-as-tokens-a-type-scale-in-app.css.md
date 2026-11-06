---
id: TASK-298
title: 'Font sizes as tokens: a type scale in app.css'
status: Done
assignee:
  - '@claude'
created_date: '2026-11-06 19:35'
updated_date: '2026-11-06 19:37'
labels: []
dependencies: []
priority: medium
type: task
ordinal: 360000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
`.claude/rules/ui-components.md` lists fonts among the values used only through tokens, but `app/src/app.css` defines the families and no sizes; components use eight literal sizes from 12 to 18 px in about 40 declarations. Decided by the owner (TASK-297, question 1): sizes count. Add a type scale of custom properties to `app/src/app.css` with the sizes in use and replace every literal `font-size` in components and pages with it; nothing changes on screen.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 app.css defines a type scale covering every font size in use
- [x] #2 No component or page sets a literal font-size in px
- [x] #3 Pages and stories look the same in light and dark; stories pass
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. --fs-1 … --fs-9 in app.css :root, one per size in use (12, 12.5, 13, 13.5, 14, 15, 18, 23, 26 px)
2. Replace every literal font-size in px in app.css, components and pages
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
- 54 declarations replaced in 31 files; values unchanged, so nothing moves on screen. Every story passes in light and dark.
- --fs-8 (23 px) is used only by the phone restyle of h1 that TASK-302 removes; that task drops the token if nothing else uses it.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Font sizes are tokens now: app.css defines a scale --fs-1 to --fs-9 with the sizes in use, and no component, page or base style sets a literal px font size. Values are unchanged; all stories pass in both schemes.
<!-- SECTION:FINAL_SUMMARY:END -->
