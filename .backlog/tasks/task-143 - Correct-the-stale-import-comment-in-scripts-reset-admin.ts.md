---
id: TASK-143
title: Correct the stale import comment in scripts/reset-admin.ts
status: To Do
assignee: []
created_date: '2026-10-30 10:55'
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
- [ ] #1 The comment in `scripts/reset-admin.ts` states the same rule as `app/src/lib/server/log.ts`
<!-- AC:END -->
