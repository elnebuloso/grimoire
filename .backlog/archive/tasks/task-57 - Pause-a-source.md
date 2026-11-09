---
id: TASK-57
title: Pause a source
status: Done
assignee:
  - '@claude'
created_date: '2026-10-29 18:19'
updated_date: '2026-10-29 18:24'
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
- [x] #1 A source can be paused and resumed in the admin area, both when it is created and later; the setting works without JavaScript
- [x] #2 Polling never syncs a paused source, whatever its schedule says
- [x] #3 "Sync now" on a paused source syncs it once and leaves it paused
- [x] #4 A paused source keeps its index, schedule and settings; resuming it syncs it on its next due poll
- [x] #5 The source page and the project list show that a source is paused
- [x] #6 The agent environment fixture source `platform/next` is paused and never synced, with a normal schedule, and `.claude/rules/agent-environment.md` says so
- [x] #7 Pausing is described in `docs/handbook/admin.md`
- [x] #8 Tests cover that polling skips a paused source, "Sync now" while paused, and resuming
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Migration 0006 adds sources.paused (0/1, default 0).
2. listSchedules (db/sources.ts) leaves paused sources out, so polling never syncs them.
3. SourceForm/SourceSettings carry paused; source form and wizard get a checkbox (no JavaScript needed), the wizard carries it through its steps.
4. Saving or creating a paused source requests no sync; the sync action is unchanged, so "Sync now" syncs it once and it stays paused.
5. Source page shows Polling paused/active and no next check while paused; the project's source list marks it paused.
6. Agent fixture platform/next: paused = 1, no schedule, last_checked_at NULL.
7. Handbook docs/handbook/admin.md; unit tests in admin/projects.spec.ts, routes projects.spec.ts and wizard.spec.ts.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Committed together with the fix that rejects a schedule that never runs (0d33c2d), so the fixture never needed a bridging schedule.

Verification in the agent environment: after the reset and several polls, platform/next stays paused with last_checked_at NULL. The source page shows "Polling: paused" and "Last check: never" without a next check, and the project page lists it as paused. "Sync now" synced it (4 pages) and it stayed paused. Saving the form without the checkbox resumed it (paused = 0). The form rejects "0 0 30 2 *" with "it never runs". make test (303), make lint, make e2e (9/9) and make handbook all pass.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Sources can be paused: a sources.paused flag (migration 0006) that polling honours by leaving paused sources out of listSchedules. A paused source keeps its index, schedule and settings. "Sync now" syncs it once without resuming it, and saving or creating it paused starts no sync. The checkbox is in the source form and the project wizard and needs no JavaScript. The source page and the project's source list show the state, and docs/handbook/admin.md describes it.

The agent environment's platform/next is now paused and never checked, which replaces the 30 February schedule. parseSchedule rejects schedules like that since 0d33c2d.

Verified with unit tests and by hand in the agent environment; make test, lint, e2e and handbook pass. No e2e test for pausing: the actions are covered by the route specs, and the browser tests need a source that syncs.
<!-- SECTION:FINAL_SUMMARY:END -->
