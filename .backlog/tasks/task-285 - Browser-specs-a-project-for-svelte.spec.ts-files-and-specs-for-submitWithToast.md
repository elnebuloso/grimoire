---
id: TASK-285
title: >-
  Browser specs: a project for svelte.spec.ts files and specs for
  submitWithToast
status: To Do
assignee: []
created_date: '2026-11-06 15:58'
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
- [ ] #1 `*.svelte.spec.ts` files run in a Chromium project, or the exclude is removed so nobody writes one expecting it to run
- [ ] #2 `submitWithToast` has specs for: redirect to the same page, redirect elsewhere, a refusal with and without `onfailure`, and an error
<!-- AC:END -->
