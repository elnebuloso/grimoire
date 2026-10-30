---
id: TASK-147
title: Check formatting and lint rules in scripts/ too
status: To Do
assignee: []
created_date: '2026-10-30 11:29'
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
- [ ] #1 `make lint` also checks the TypeScript files in `scripts/` for formatting and lint rules, and fails on violations there
- [ ] #2 The existing files in `scripts/` pass
<!-- AC:END -->
