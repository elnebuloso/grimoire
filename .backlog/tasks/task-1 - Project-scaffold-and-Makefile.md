---
id: TASK-1
title: Project scaffold and Makefile
status: To Do
assignee: []
created_date: '2026-10-28T19:30:00Z'
labels:
  - ops
milestone: m-0
dependencies: []
documentation:
  - docs/konzept.md
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
- [ ] #1 SvelteKit app with TypeScript exists, created by the user via `sv create` with the Vitest add-on
- [ ] #2 `Makefile` has `help`, `dev`, `build`, `test` and `lint` targets, each with a `## ` description and listed in `.PHONY`
- [ ] #3 `make test` runs and passes on the fresh scaffold
<!-- AC:END -->
