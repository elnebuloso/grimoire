---
id: TASK-147
title: Check formatting and lint rules in scripts/ too
status: Done
assignee:
  - '@claude'
created_date: '2026-10-30 11:29'
updated_date: '2026-10-30 12:01'
labels:
  - ops
milestone: m-0
dependencies: []
priority: low
type: chore
ordinal: 209000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Noticed while fixing a comment in `scripts/reset-admin.ts` after the second whole-project code review of 2026-10-30: Prettier with the app configuration reports style issues in that file, and nothing catches it, because `make lint` runs `prettier --check .` and `eslint .` only inside `app/`. The TypeScript in `scripts/` (`reset-admin.ts`, `agent-seed.ts`) imports server code from `app/src/` and ships in the image, so it should meet the same rules as the code it imports.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 `make lint` also checks the TypeScript files in `scripts/` for formatting and lint rules, and fails on violations there
- [x] #2 The existing files in `scripts/` pass
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. app/package.json: lint runs a new lint:scripts (prettier with --config prettier.config.js on ../scripts, then eslint from the repository root with --config app/eslint.config.js, because ESLint ignores files outside its working directory); format also formats ../scripts.
2. make format to bring agent-seed.ts and reset-admin.ts in line.
3. Check that make lint passes, and fails with a lint and a format violation in scripts/.
<!-- SECTION:PLAN:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
make lint (and so CI) now also checks the TypeScript in scripts/: lint:scripts in app/package.json runs Prettier with the app config on ../scripts and ESLint from the repository root with --config app/eslint.config.js, since ESLint ignores files outside its working directory and Prettier would not find the app config next to them. make format formats scripts/ too, which reformatted agent-seed.ts and reset-admin.ts (line breaks only). Checked: make lint passes; with a temporary file in scripts/ it fails on an unused variable (ESLint) and on unformatted code (Prettier).
<!-- SECTION:FINAL_SUMMARY:END -->
