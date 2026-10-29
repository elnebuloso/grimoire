---
id: TASK-51
title: Component catalog and component tests with Storybook
status: To Do
assignee: []
created_date: '2026-10-29T06:50:00Z'
updated_date: '2026-10-29T06:55:00Z'
labels:
  - admin
dependencies: []
references:
  - .claude/rules/svelte-kit.md
  - app/src/lib/components/ProjectStatsTable.svelte
priority: medium
type: feature
ordinal: 113000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Developers want to extend the UI without reading every route first. Today the only shared component is `app/src/lib/components/ProjectStatsTable.svelte`; the rest of the markup lives in the routes, so a developer cannot see what already exists, rebuilds it, and can only check behaviour through slow end-to-end tests over whole pages. A catalog of the components with their states shows what exists, and running those states as tests makes behaviour cheap to check. Once the design system lands with TASK-37, the catalog is where components are measured against it.

Decided with the user: the catalog and component tests use Storybook, set up with the Svelte CLI add-on (`npx sv add storybook`, see `.claude/rules/svelte-kit.md`). Not checked yet whether the add-on supports SvelteKit 3. Out of scope: which component library the components build on is decided later.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Storybook runs locally through a documented `make` target and shows every component in `app/src/lib/components`
- [ ] #2 Every component has stories for its states, including empty and error states where it has them
- [ ] #3 Components with behaviour (input, toggles, form state) have interaction tests in their stories
- [ ] #4 The stories run as tests in `make test` and in the CI pipeline, and a broken story fails the build
- [ ] #5 A short guide for developers says where components live, that a new component comes with stories, and to look in the catalog before writing one
- [ ] #6 Neither the production build nor the Docker image contains Storybook
<!-- AC:END -->
