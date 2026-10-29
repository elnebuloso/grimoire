---
id: TASK-1
title: Project scaffold and Makefile
status: Done
assignee:
  - '@claude'
created_date: '2026-10-28T19:30:00Z'
updated_date: '2026-10-29T00:34:00Z'
labels:
  - ops
milestone: m-0
dependencies: []
documentation:
  - docs/concept.md
priority: high
type: chore
ordinal: 1000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The repository holds only the concept; every other task needs a running SvelteKit app and one way to build, test and lint it. Project rules: the SvelteKit app is created by the user with the official `sv` CLI (agents give the exact commands and wait), and all project commands run through `make` targets.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 SvelteKit app with TypeScript exists, created by the user via `sv create` with the Vitest add-on
- [x] #2 `Makefile` has `help`, `dev`, `build`, `test` and `lint` targets, each with a `## ` description and listed in `.PHONY`
- [x] #3 `make test` runs and passes on the fresh scaffold
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Root `Makefile` delegating to `app/` via `npm --prefix app run …`
2. Targets `help`, `dev`, `build`, `test`, `lint` (lint = prettier + eslint + svelte-check), documented and phony
3. Verify `make help`, `make test`, `make lint`, `make build`
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
App lives in `app/` (user decision), created with `npx sv create --template minimal --types ts --add sveltekit-adapter="adapter:node" vitest="usages:unit" eslint prettier --install npm app`. Drizzle, Tailwind, better-auth, Playwright deliberately left out. Verified: `make help`, `make test` (1 passed), `make lint` (prettier, eslint, svelte-check 0 errors), `make build` all succeed.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Root `Makefile` delegating to the SvelteKit app in `app/` with `help`, `dev`, `build`, `test`, `lint` (lint also runs `svelte-check`). Scaffold by `sv create` with adapter-node, Vitest (unit), ESLint, Prettier. All targets verified. Follow-up: no `install` target yet; `npm --prefix app ci` is needed on a fresh clone.
<!-- SECTION:FINAL_SUMMARY:END -->
