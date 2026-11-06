---
id: TASK-298
title: 'Font sizes as tokens: a type scale in app.css'
status: To Do
assignee: []
created_date: '2026-11-06 19:35'
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
- [ ] #1 app.css defines a type scale covering every font size in use
- [ ] #2 No component or page sets a literal font-size in px
- [ ] #3 Pages and stories look the same in light and dark; stories pass
<!-- AC:END -->
