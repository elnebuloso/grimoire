---
id: TASK-51
title: Component catalog and component tests with Storybook
status: Done
assignee:
  - '@claude'
created_date: '2026-10-29T06:50:00Z'
updated_date: '2026-10-29 18:50'
labels:
  - admin
milestone: m-0
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
- [x] #1 Storybook runs locally through a documented `make` target and shows every component in `app/src/lib/components`
- [x] #2 Every component has stories for its states, including empty and error states where it has them
- [x] #3 Components with behaviour (input, toggles, form state) have interaction tests in their stories
- [x] #4 The stories run as tests in `make test` and in the CI pipeline, and a broken story fails the build
- [x] #5 A short guide for developers says where components live, that a new component comes with stories, and to look in the catalog before writing one
- [x] #6 Neither the production build nor the Docker image contains Storybook
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. The user runs npx sv add storybook (Recommended configuration, Playwright with Chromium); I clean up afterwards.
2. Pin all versions to releases at least two weeks old; drop Chromatic, coverage and the example stories.
3. Stories with play checks for ProjectStatsTable.
4. Vitest browser project storybook, so make test and CI run the stories; make storybook target; CI installs the Chromium libraries before make test.
5. Developer guide docs/components.md, linked from the README.
6. Verify: stories run and a broken one fails, catalog lists them, build and Docker image contain no Storybook.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Storybook 10.6.2 works with SvelteKit 3: the catalog starts, and the stories render as Vitest browser tests.

Versions: 10.6.5 (the CLI default) was published on 2026-10-27, less than two weeks ago, so the Storybook packages are pinned to 10.6.2 (2026-10-12) and addon-svelte-csf to 5.1.5. @storybook/svelte is pinned directly: the peer dependency of addon-svelte-csf otherwise resolved to 10.6.5, which requires storybook ^10.6.5 (ERESOLVE).

esbuild's postinstall is not covered by allowScripts. Storybook and the tests work without it, so it was not approved.

Verification:
- make test: 308 tests, 303 plus 5 stories. With one assertion broken on purpose, npm test failed with exit 1.
- make storybook serves index.json with the 5 ProjectStatsTable stories.
- make lint and make e2e (11/11) pass.
- The build contains no Storybook code; its only mention is package.json embedded in a source map.
- npm ls --omit=dev contains no storybook, playwright or vitest, and the Dockerfile prunes dev dependencies.
- AC #3: ProjectStatsTable has no input, toggles or form state, so it has no interaction tests; every story checks its rendered state in play.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Storybook 10.6.2, set up with sv add storybook, is the component catalog: make storybook opens it on port 6006. A Vitest browser project named storybook renders every story in headless Chromium and runs its play function, in make test and in CI; a broken story fails the build. ProjectStatsTable, so far the only shared component, has stories for five states, each checked in play.

docs/components.md is the developer guide: where components live, that each one comes with stories, and to look in the catalog first. Versions are pinned to releases at least two weeks old. Left out of what the CLI generated: Chromatic, coverage, example stories, telemetry. Neither the production build nor the Docker image contains Storybook.

Follow-up: TASK-52 fills the catalog with the components extracted from the routes.
<!-- SECTION:FINAL_SUMMARY:END -->
