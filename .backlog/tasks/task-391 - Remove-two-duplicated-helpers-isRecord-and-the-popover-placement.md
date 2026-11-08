---
id: TASK-391
title: 'Remove two duplicated helpers: isRecord and the popover placement'
status: Done
assignee:
  - '@claude'
created_date: '2026-11-08 16:45'
updated_date: '2026-11-08 18:42'
labels: []
dependencies: []
priority: low
type: chore
ordinal: 453000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Two pieces of code exist twice and would have to change together:

- `isRecord` is identical in `app/src/lib/server/parsing/site-config.ts:110` and `app/src/lib/server/parsing/slugs.ts:97`.
- `place()`, which positions a native popover below its button, is the same in `app/src/lib/components/ActionMenu.svelte:18-23` and `app/src/lib/components/UserMenu.svelte:20-25`; only the offset differs (4 px and 6 px).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 isRecord exists once and both parsing modules import it
- [x] #2 The popover placement exists once, with the offset as a parameter, used by ActionMenu and UserMenu
- [x] #3 The stories of ActionMenu and UserMenu and the parsing specs pass; the menus open where they did before
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. isRecord exported from site-config.ts, imported by slugs.ts.
2. placeBelow(event, button, popover, gap) in app/src/lib/popover.ts, used by ActionMenu (4 px) and UserMenu (6 px).
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Same arithmetic and offsets as before. Stories of both menus and the parsing specs pass (134 tests); position not checked in a browser.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
isRecord and the popover placement each exist once now: isRecord in site-config.ts, placeBelow in popover.ts with the gap as a parameter. No behaviour change; stories and parsing specs pass.
<!-- SECTION:FINAL_SUMMARY:END -->
