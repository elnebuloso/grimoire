---
id: TASK-287
title: Run the story accessibility check in the dark scheme too
status: To Do
assignee: []
created_date: '2026-11-06 15:58'
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
- [ ] #1 Story tests run once in light and once in dark, and axe fails a dark contrast violation
- [ ] #2 A deliberately low-contrast dark token makes the run fail (checked once by hand, then reverted)
- [ ] #3 `.claude/rules/testing-strategy.md` reflects the new run time
<!-- AC:END -->
