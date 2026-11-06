---
id: TASK-285
title: >-
  Browser specs: a project for svelte.spec.ts files and specs for
  submitWithToast
status: Done
assignee:
  - '@claude'
created_date: '2026-11-06 15:58'
updated_date: '2026-11-06 18:35'
labels: []
dependencies: []
priority: medium
type: task
ordinal: 347000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The server test project excludes `src/**/*.svelte.{test,spec}.{js,ts}` (`app/vite.config.ts`), and the Storybook project takes only story files (`storybookTest` replaces its `include`). A browser spec named the way Svelte names one, e.g. `forms.svelte.spec.ts`, is run by no project and nothing reports it; the first person to write one sees a green run that never executed it.

`submitWithToast` (`app/src/lib/forms.ts`) carries the busy button, refresh in place versus leaving the page, the toast and refusals routed to `onfailure`. Six components and pages use it. It has no spec.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 `*.svelte.spec.ts` files run in a Chromium project, or the exclude is removed so nobody writes one expecting it to run
- [x] #2 `submitWithToast` has specs for: redirect to the same page, redirect elsewhere, a refusal with and without `onfailure`, and an error
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. A vitest project 'browser' runs src/**/*.svelte.spec.ts in Chromium (Playwright provider, as the stories)
2. src/lib/forms.svelte.spec.ts covers submitWithToast: redirect to the same page, redirect elsewhere, a refusal with and without onfailure (focus on the named field), an error; busy state of the button
3. testing-strategy.md names the project
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
- vite.config.ts changed, so the full make test ran before the commit: 118 files, 1115 tests green.
- The cost table is remeasured in TASK-294.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
*.svelte.spec.ts files now run in a Chromium project named browser instead of in no project at all. submitWithToast has specs for a redirect to the same page, a redirect elsewhere, a refusal with and without onfailure (including the field focus), and an error answer. Full make test green.
<!-- SECTION:FINAL_SUMMARY:END -->
