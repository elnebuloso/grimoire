---
id: TASK-358
title: >-
  Tests: the first story of a file must not pay the accessibility checker's cold
  start
status: To Do
assignee: []
created_date: '2026-11-06 23:47'
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
- [ ] #1 The first story of a file no longer carries the axe load inside its test, or the storybook project has a timeout that covers it under load
- [ ] #2 The storybook project passes with a parallel server run loading the machine
<!-- AC:END -->
