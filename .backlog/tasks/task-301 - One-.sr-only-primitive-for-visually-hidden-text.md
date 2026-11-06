---
id: TASK-301
title: One .sr-only primitive for visually hidden text
status: To Do
assignee: []
created_date: '2026-11-06 19:35'
labels: []
dependencies: []
priority: low
type: chore
ordinal: 363000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The visually hidden style is written four times: `.hidden` in `app/src/routes/manage/+layout.svelte`, `.spoken` in `DeadLinkList.svelte`, in `SegmentedSwitch.svelte`, and the skip link in `AppShell.svelte`. Decided by the owner (TASK-297, question 5): add `.sr-only` to `app/src/app.css`, name it in the list of page primitives in `.claude/rules/ui-components.md`, and use it in all four places; the skip link keeps its focus variant.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 app.css defines .sr-only and ui-components.md lists it among the primitives
- [ ] #2 The four copies use .sr-only; the skip link still shows on focus
- [ ] #3 Stories of the touched components pass
<!-- AC:END -->
