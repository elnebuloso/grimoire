---
id: TASK-57
title: Pause a source
status: To Do
assignee: []
created_date: '2026-10-29 18:19'
labels:
  - sync
  - admin
milestone: m-0
dependencies: []
references:
  - app/src/lib/server/sync/index.ts
  - scripts/agent-seed.ts
priority: medium
type: feature
ordinal: 119000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
A source can only stop syncing today by being deleted, which drops its index. When a repository moves, a token expires or a Git server is under maintenance, the admin wants to stop the source for a while: as it is, it keeps failing and collecting errors at every poll. The agent environment (TASK-55) also needs a source that stays "never synced". Until now that took a schedule that never comes due, and `parseSchedule` (`app/src/lib/server/sync/schedule.ts`) now rejects such schedules. A source created and paused before its first poll is that state, and it can occur in the real product.

Decided with the user: a paused source is a flag on the source, not a special cron expression; its schedule stays valid and is kept.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 A source can be paused and resumed in the admin area, both when it is created and later; the setting works without JavaScript
- [ ] #2 Polling never syncs a paused source, whatever its schedule says
- [ ] #3 "Sync now" on a paused source syncs it once and leaves it paused
- [ ] #4 A paused source keeps its index, schedule and settings; resuming it syncs it on its next due poll
- [ ] #5 The source page and the project list show that a source is paused
- [ ] #6 The agent environment fixture source `platform/next` is paused and never synced, with a normal schedule, and `.claude/rules/agent-environment.md` says so
- [ ] #7 Pausing is described in `docs/handbook/admin.md`
- [ ] #8 Tests cover that polling skips a paused source, "Sync now" while paused, and resuming
<!-- AC:END -->
