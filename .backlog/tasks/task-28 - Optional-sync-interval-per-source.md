---
id: TASK-28
title: Optional sync schedule per source
status: Done
assignee:
  - '@claude'
created_date: '2026-10-28T21:10:00Z'
updated_date: '2026-10-28T21:19:00Z'
labels:
  - sync
milestone: m-0
dependencies:
  - TASK-8
  - TASK-27
documentation:
  - docs/konzept.md
priority: medium
type: feature
ordinal: 28000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
All sources were checked at the same global interval. Some Git servers allow only a few requests per hour, and some sources change so rarely that checking every few minutes is pointless. Decided with the user: a cron expression per source (via `croner`), with a global default; it replaces the global minute interval, so there is one model. Since polling ticks anyway, evaluating a cron expression costs no more than an interval and is precise to the minute.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 A source can have its own cron expression; without one, `SYNC_SCHEDULE` applies (default `*/5 * * * *`)
- [x] #2 A source is checked when the next run of its schedule after its last check has come, also after a failed check; a run missed while the server was down is made up once at start
- [x] #3 Only standard five-field expressions are accepted; an invalid `SYNC_SCHEDULE` stops the start, an invalid source schedule is stored as the error of that source
- [x] #4 A changed source schedule takes effect without a restart
- [x] #5 Tests cover which sources are due, the default, invalid expressions, and that every check records its time
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Migration `0003-source-sync-schedule.sql`: `sources.sync_schedule` (NULL = default) and `sources.last_checked_at`.
2. `sync/schedule.ts`: `parseSchedule` (croner, `mode: 5-part`, throws a readable error) and `isDue(schedule, lastCheckedAt, now, timezone?)` = never checked, or `nextRun(lastCheckedAt) <= now`. Server time zone, pinned in tests.
3. `db/sources.ts`: `listSchedules`, `recordCheck`.
4. `syncSource` records the time its check started, whatever the outcome.
5. `SYNC_SCHEDULE` replaces `SYNC_INTERVAL_MINUTES` in `app/src/env.ts`, `.env.example`, handbook.
6. `sync/index.ts`: tick every 15 s, queue due sources; an invalid source schedule is recorded as its error.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
`croner` pinned to 10.0.1: 11.0.0 was two days old when this was built. No dependencies of its own; `npm audit` reports nothing for it.

Found in the end-to-end run: a source with an invalid schedule was still synced once at start, because "never checked" returned before the expression was read. Fixed in `isDue` with a regression test.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Sources are checked by cron expression: `sources.sync_schedule` (migration `0003-source-sync-schedule.sql`, NULL = default) or `SYNC_SCHEDULE` (default `*/5 * * * *`), which replaces `SYNC_INTERVAL_MINUTES`. `sync/schedule.ts` uses `croner` (10.0.1, `mode: 5-part`): `parseSchedule` rejects anything but five fields with a readable error, `isDue` is true when never checked or when the next run after `last_checked_at` has come, so a run missed during downtime is made up once. `syncSource` records the start time of every check in `last_checked_at`, whatever the outcome. Polling ticks every 15 s and queues due sources; an invalid source schedule is stored as its error, an invalid `SYNC_SCHEDULE` stops the start. Handbook (`docs/handbook/database.md`), `.env.example` and `docs/konzept.md` updated. Verified: 10 tests in `schedule.spec.ts` (pinned time zones, incl. Berlin winter time), a check-time test in `sync.spec.ts` (109 tests in total), `make lint`, `make build`; end-to-end with the built server: invalid `SYNC_SCHEDULE` refused, three sources checked at start, the every-minute source picked up a push at its next run (5 s after the minute), the yearly one did not, the invalid one showed its error, clean exit on SIGTERM.
<!-- SECTION:FINAL_SUMMARY:END -->
