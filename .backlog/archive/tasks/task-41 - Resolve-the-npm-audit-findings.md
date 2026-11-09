---
id: TASK-41
title: Resolve the npm audit findings
status: Done
assignee:
  - '@claude'
created_date: '2026-10-29T00:47:00Z'
updated_date: '2026-10-29T01:20:00Z'
labels: []
milestone: m-0
dependencies: []
priority: medium
type: chore
ordinal: 103000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
`npm audit` in `app/` reports moderate findings in `vitest` and `@vitest/mocker` and low findings in `@sveltejs/kit`, `@sveltejs/adapter-node` and `@sveltejs/vite-plugin-svelte` (via `deepmerge`). Kit and adapter-node ship in the image. Updates follow the dependency rule: at least two weeks old and pinned, except security fixes.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Each finding is fixed by an update or judged not to affect grimoire, with the reason recorded
- [x] #2 `make lint`, `make test` and `make e2e` pass after the updates
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Update `vitest` to the first release fixing the `@vitest/mocker` advisories, pinned exactly
2. Judge the `deepmerge` finding under `@sveltejs/vite-plugin-svelte`, which has no fixed version
3. Run `make lint`, `make test`, `make e2e`
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
`vitest` 4.1.8 -> 4.1.12 (released 2026-10-15, security fix), pinned. Lockfile changes only the vitest packages. Clears GHSA-qxg6-89mg-rqv8 and GHSA-xp26-3454-mjgp.

`deepmerge` (GHSA-gcqx-w48m-w2h4, low; reported again on `@sveltejs/vite-plugin-svelte`, `@sveltejs/kit` and `@sveltejs/adapter-node`) does not affect grimoire: every affected `deepmerge` release is vulnerable, so no update exists; `vite-plugin-svelte` uses it only in `src/utils/options.js` to merge the project's own Svelte config at build and dev time, never on request input; `npm ls deepmerge` shows it only under `vite-plugin-svelte`; `app/build` contains no `deepmerge` (grep: 0 files); and the Dockerfile runs `npm prune --omit=dev`, which drops all of `@sveltejs/*` from the image. The task description said Kit and adapter-node ship in the image: only their build output does, which does not contain `deepmerge`.

`npm audit` afterwards: 4 low, all the `deepmerge` chain. `make lint`, `make test` (244 tests) and `make e2e` (6 tests) pass.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Updated `vitest` to 4.1.12 (pinned), which fixes both moderate `@vitest/mocker` advisories. The remaining low `deepmerge` finding has no fixed release and does not reach grimoire: it only merges our own Svelte config at build time and is neither in `app/build` nor in the image. Lint, unit and e2e tests pass. `npm audit` keeps reporting the 4 low findings until `vite-plugin-svelte` drops or replaces `deepmerge`.
<!-- SECTION:FINAL_SUMMARY:END -->
