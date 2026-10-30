---
id: TASK-150
title: 'Make make agent-reset clear every table, including missed_queries'
status: To Do
assignee:
  - '@claude'
created_date: '2026-10-30 13:41'
labels:
  - ops
milestone: m-0
dependencies: []
priority: medium
type: bug
ordinal: 212000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Found by the whole-project code review of 2026-10-30 (13:25). `make agent-reset` runs `scripts/agent-seed.ts`, which deletes a hand-kept list of eleven tables (`api_key_projects`, `api_keys`, `sessions`, `user_roles`, `users`, `links`, `snippets`, `snippets_fts`, `pages`, `sources`, `projects`) and resets `settings`. `missed_queries` (migration `0015`) is not in the list and has no foreign key that would take it along, so after a reset the missed-queries page and the dashboard still show questions from earlier runs. `.claude/rules/agent-environment.md` promises a reset returns to the fixture state, so a check that relies on it starts from a wrong state. Any table added later survives the reset the same way, because nothing ties the list to the schema.

The comment above the imports in `scripts/agent-seed.ts` also still says an imported file "may itself import only `node:` modules", which is false: `admin/auth.ts` imports pino via `log.ts` and `sync/queue.ts`. `scripts/reset-admin.ts` already carries the corrected wording (plain node, no Vite: imported `.ts` files need their extension and may import npm packages and `node:` modules, but nothing that needs Vite such as `#lib` or `$app`).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 After `make agent-reset`, `missed_queries` is empty
- [ ] #2 A table added by a future migration is cleared by the reset without editing `scripts/agent-seed.ts` (FTS shadow tables and the migration bookkeeping excepted, `settings` reset to defaults as today)
- [ ] #3 The import comment in `scripts/agent-seed.ts` states the actual rule, as in `scripts/reset-admin.ts`
<!-- AC:END -->
