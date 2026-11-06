---
id: TASK-301
title: One .sr-only primitive for visually hidden text
status: Done
assignee:
  - '@claude'
created_date: '2026-11-06 19:35'
updated_date: '2026-11-06 19:40'
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
- [x] #1 app.css defines .sr-only and ui-components.md lists it among the primitives
- [x] #2 The four copies use .sr-only; the skip link still shows on focus
- [x] #3 Stories of the touched components pass
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. .sr-only and its focus variant .sr-only-focusable in app.css, one rule
2. The manage sidebar counts and the dead-link arrow use .sr-only, the skip link .sr-only-focusable; their copies go
3. ui-components.md lists the primitive
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
- The SegmentedSwitch copy was the phone label style; it went with TASK-302, so three copies remained.
- Checked by hand: the skip link stays clipped until focused and shows at the top left on Tab. DeadLinkList and AppShell stories pass.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Visually hidden text uses one primitive now: .sr-only in app.css (with .sr-only-focusable for the skip link), listed in ui-components.md; the copies in the manage layout, DeadLinkList and AppShell are gone. Skip link checked by hand; stories pass.
<!-- SECTION:FINAL_SUMMARY:END -->
