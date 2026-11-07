---
id: TASK-358
title: >-
  Tests: the first story of a file must not pay the accessibility checker's cold
  start
status: Done
assignee:
  - '@claude'
created_date: '2026-11-06 23:47'
updated_date: '2026-11-07 01:00'
labels: []
dependencies: []
references:
  - app/vite.config.ts
priority: low
type: task
ordinal: 420000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Every story runs axe through `@storybook/addon-a11y`, which loads it with a dynamic `import("axe-core")` (`node_modules/@storybook/addon-a11y/dist/_browser-chunks/…`). Each story file runs in its own iframe, so the first story of every file loads and starts axe inside its own test timeout (vitest default 15 s for browser projects; none set for the `storybook` project in `app/vite.config.ts`, around lines 58-77).

Measured idle: first story 1.4–1.5 s, later stories 0.16–0.20 s. In a full `make test` at load average 9 on 4 cores, `Preferences.stories.svelte > FollowingTheSystem` (the first story of its file; its play function never waits) failed after 16 s and passed on a rerun.

Suggested fix: a setup file for the storybook project that imports `axe-core`, moving the load out of the first test, or `testTimeout: 30_000` for the project. Prefer the setup file if it works with the addon (it must use the same module instance).

Found by the third whole-repo audit on 2026-11-07 (HEAD 4a72798).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 The first story of a file no longer carries the axe load inside its test, or the storybook project has a timeout that covers it under load
- [x] #2 The storybook project passes with a parallel server run loading the machine
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. .storybook/vitest.setup.ts imports axe-core; the storybook project runs it as setup file, so the addon's first dynamic import finds it loaded
2. Measure the first story of a file before and after; run the storybook project beside a server run
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
- First story of Preferences.stories.svelte: 1.7-2.0 s before, 0.8-0.9 s after (light and dark); later stories unchanged.
- Storybook project (248 tests) passes beside a full server run (1068 tests).
- axe-core comes with @storybook/addon-a11y and is not a direct dependency in app/package.json; the setup file resolves it from there.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
The storybook test project now loads axe-core in a setup file before the stories of a file run, so the first story no longer pays the accessibility checker's load inside its timeout: 0.8 s instead of 1.7-2.0 s. The project passes beside a full server run.
<!-- SECTION:FINAL_SUMMARY:END -->
