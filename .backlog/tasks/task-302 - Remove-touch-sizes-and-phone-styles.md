---
id: TASK-302
title: Remove touch sizes and phone styles
status: To Do
assignee: []
created_date: '2026-11-06 19:35'
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
- [ ] #1 No pointer: coarse rule and no phone breakpoint below 1024 px remains in app.css, SegmentedSwitch and Toast
- [ ] #2 Pages checked at 1024 px and wider in light and dark; stories pass
<!-- AC:END -->
