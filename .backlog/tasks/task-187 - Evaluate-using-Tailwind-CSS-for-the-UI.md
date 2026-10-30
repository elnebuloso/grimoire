---
id: TASK-187
title: Evaluate using Tailwind CSS for the UI
status: To Do
assignee: []
created_date: '2026-10-30 21:41'
updated_date: '2026-10-30 21:42'
labels:
  - admin
milestone: m-0
dependencies: []
priority: low
type: spike
ordinal: 249000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Check whether grimoire should style its UI with Tailwind CSS instead of, or alongside, the current setup.

Today: no Tailwind. The design (`docs/DESIGN.md`) lives as custom properties and a base of native elements in `app/src/app.css`; components and pages style themselves in scoped `<style>` blocks with `var(--…)` tokens (rules in `.claude/rules/ui-components.md`). Light and dark come from `light-dark()` tokens and `data-theme`.

Questions to answer:
- What would change for a maintainer: how tokens, both schemes, `prefers-reduced-motion` and `pointer: coarse` sizes map to Tailwind 4 (`@theme`, variants), and what happens to the scoped styles and the page primitives (`.sheet`, `.notice`, `.table-scroll`, `.muted`).
- Cost: setup only through the Svelte CLI, never by hand (`.claude/rules/svelte-kit.md`): `npx sv@<version> add tailwindcss="plugins:none" --install npm` from `app/` after `nvm use 24.22.1`, with `sv` pinned to a release at least two weeks old (1.1.1 at the time of writing; `npm view sv time`), the add-on's only option `plugins` (typography, forms) set explicitly, and the versions it adds pinned exactly in `app/package.json`, build size and build time measured against today, Storybook, migration effort of the existing components and pages.
- What it would unlock, e.g. icon tooling such as `@iconify/tailwind4` (TASK-186 chose `@lucide/svelte` because Tailwind is absent).
- Recommendation: adopt fully, adopt only for new code, or stay with plain CSS, with the reasons.

No code change in this task; the outcome is a recommendation for the user to decide on, and if adopted, follow-up tasks.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Today's styling setup and the Tailwind 4 alternative are compared on tokens, both schemes, scoped component styles, Storybook and maintainability
- [ ] #2 Build size and build time are measured on a throwaway branch, not estimated
- [ ] #3 The migration effort for the existing components and pages is estimated
- [ ] #4 A recommendation (adopt, adopt for new code only, or stay) with reasons is recorded in the task and presented to the user
<!-- AC:END -->
