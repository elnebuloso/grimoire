---
id: TASK-287
title: Run the story accessibility check in the dark scheme too
status: Done
assignee:
  - '@claude'
created_date: '2026-11-06 15:58'
updated_date: '2026-11-06 18:42'
labels: []
dependencies: []
priority: medium
type: task
ordinal: 349000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Every story runs axe and fails on a violation (`.storybook/preview.ts`). The theme starts as `system` and the decorator sets no `data-theme`; the browser instance sets no colour scheme (`app/vite.config.ts`), and headless Chromium reports light. No story sets `globals.theme`. So `color-contrast` sees only the light value of each `light-dark()` token in `app/src/app.css`. The ui-components rule requires 4.5:1 contrast in both schemes; a dark token below that passes CI, and `theme.e2e.ts` checks one dark value without axe.

Whether `@vitest/browser-playwright` accepts a colour scheme per instance is not checked. Expected cost: one more Storybook run (about 30 s per the testing rule).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Story tests run once in light and once in dark, and axe fails a dark contrast violation
- [x] #2 A deliberately low-contrast dark token makes the run fail (checked once by hand, then reverted)
- [x] #3 `.claude/rules/testing-strategy.md` reflects the new run time
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. The storybook project runs two Chromium instances, light and dark (contextOptions.colorScheme), so axe checks both schemes
2. Check once that a dark token below 4.5:1 fails, then revert
3. testing-strategy.md: the storybook run time
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
- Checked by hand: --ink-2 dark set to #2a2e33 failed every SegmentedSwitch story with color-contrast; reverted.
- All 236 story tests pass in both schemes: no dark token needed raising, so app.css is unchanged.
- The storybook project now takes about 80 s (was 30 s); the whole cost table is measured again in TASK-294.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Story tests run in a light and a dark Chromium instance, so axe's color-contrast check now sees the dark value of every light-dark() token. A deliberately low dark token failed the run (checked, then reverted); the current tokens pass in both schemes. testing-strategy.md notes the longer storybook run.
<!-- SECTION:FINAL_SUMMARY:END -->
