---
id: TASK-143
title: Correct the stale import comment in scripts/reset-admin.ts
status: Done
assignee:
  - '@claude'
created_date: '2026-10-30 10:55'
updated_date: '2026-10-30 11:20'
labels:
  - ops
milestone: m-0
dependencies: []
priority: low
type: chore
ordinal: 205000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Found in the second whole-project code review of 2026-10-30. The comment in `scripts/reset-admin.ts` (lines 6-7) says an imported `.ts` file "may itself import only `node:` modules". That is no longer true: `app/src/lib/server/admin/auth.ts` imports `log.ts`, which imports `pino`, `@elastic/ecs-pino-format` and `pino-pretty`; `app/src/lib/server/log.ts` (lines 1-2) states the real rule (npm packages and `node:` modules, nothing that needs Vite such as `#lib` or `$app`). The next reader of the script would believe the comment.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 The comment in `scripts/reset-admin.ts` states the same rule as `app/src/lib/server/log.ts`
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
Reword the comment to the rule log.ts states: npm packages and node: modules, nothing that needs Vite (#lib, $app).
<!-- SECTION:PLAN:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
The comment in scripts/reset-admin.ts now states the rule app/src/lib/server/log.ts states: an imported .ts file may import npm packages and node: modules, but nothing that needs Vite (#lib, $app). Comment only. Note: Prettier (app config) already reported style issues for this file before the change; scripts/ is outside make lint.
<!-- SECTION:FINAL_SUMMARY:END -->
