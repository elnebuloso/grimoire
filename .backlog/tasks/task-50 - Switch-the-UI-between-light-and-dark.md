---
id: TASK-50
title: Switch the UI between light and dark
status: To Do
assignee: []
created_date: '2026-10-29T06:46:00Z'
updated_date: '2026-10-30 18:36'
labels:
  - admin
milestone: m-0
dependencies:
  - TASK-179
documentation:
  - docs/design.md
priority: low
type: feature
ordinal: 112000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Users want the UI to match their surroundings and the rest of their desktop: light or dark, following the operating system unless they pick one themselves.

The colours of both variants come from `docs/design.md`, which TASK-178 already turns into tokens: they follow `prefers-color-scheme` and honour `data-theme="light"` / `data-theme="dark"` on `<html>`. The switch belongs in the header next to the language switch, which TASK-179 styles as a segmented track; the theme switch with "System", "Light" and "Dark" is the second such track, and with it the track becomes a component in `app/src/lib/components/` with stories (`.claude/rules/ui-components.md`). The mockup e/6 already tries out the behaviour: `cd docs/mockups && python3 -m http.server 8765`, then `http://127.0.0.1:8765/e/6/`.
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
