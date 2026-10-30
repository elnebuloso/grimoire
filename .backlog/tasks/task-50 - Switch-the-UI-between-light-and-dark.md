---
id: TASK-50
title: Switch the UI between light and dark
status: To Do
assignee: []
created_date: '2026-10-29T06:46:00Z'
updated_date: '2026-10-30 17:41'
labels:
  - admin
milestone: m-0
dependencies:
  - TASK-37
references:
  - .claude/rules/until-v1.md
priority: low
type: feature
ordinal: 112000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Users want the UI to match their surroundings and the rest of their desktop: light or dark, following the operating system unless they pick one themselves.

Waits for TASK-37: until the visual design is agreed, the frontend carries no theming at all (`.claude/rules/until-v1.md`, section "Frontend: function first"), and a dark variant is part of that design.

The colours of both variants and the switching behaviour come from the agreed design of TASK-53 (`docs/design.md`), whose mockups already try out the switch.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Without an active choice, the UI follows the colour scheme of the operating system (`prefers-color-scheme`), and changes with it
- [ ] #2 A scheme the user picked actively is kept across pages and visits and takes precedence over the system setting
- [ ] #3 The user can go back from an active choice to following the system
- [ ] #4 Every page offers a way to switch that works without JavaScript
- [ ] #5 A page loads in the chosen scheme from the first paint, without flashing the other one
- [ ] #6 Tests cover the system default, the active choice taking precedence, and going back to the system setting
<!-- AC:END -->
