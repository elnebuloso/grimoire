---
id: TASK-151
title: Move createLimiter out of the sync module
status: Done
assignee:
  - '@claude'
created_date: '2026-10-30 13:41'
updated_date: '2026-10-30 14:04'
labels:
  - admin
milestone: m-0
dependencies: []
priority: low
type: chore
ordinal: 213000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Found by the whole-project code review of 2026-10-30 (13:25). `app/src/lib/server/admin/auth.ts` imports `createLimiter` from `app/src/lib/server/sync/queue.ts` to cap concurrent password hashing. Login hashing thereby depends on the sync module: every script loading `auth.ts` (`scripts/agent-seed.ts`, `scripts/reset-admin.ts`) loads the sync queue too, and a change made to the limiter for syncs (priorities for "sync now", say) would silently change login hashing. `admin/attempt-limit.ts` is the precedent for a small, neutral module shared by two users.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 `createLimiter` lives in a module outside `sync/` and `admin/`, imported by both `sync/queue.ts` and `admin/auth.ts`
- [x] #2 `admin/auth.ts` no longer imports anything from `sync/`
- [x] #3 The limiter behaves as before (FIFO, given concurrency); existing tests pass and the scripts in `scripts/` still run with plain node
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Move `createLimiter` (and its type, renamed from the sync-specific `Lane` to `Limiter`) into `app/src/lib/server/limiter.ts`.
2. `sync/queue.ts`, `admin/auth.ts` and `sync/sync.spec.ts` import it from there; its test moves to `limiter.spec.ts`.
3. Check: lint, tests, and `make agent-reset` (plain node loads `auth.ts`).
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
`make lint`, `make test` (631, three consecutive full runs green) and `make agent-reset` (plain node through `scripts/agent-seed.ts` -> `admin/auth.ts` -> `limiter.ts`) pass. One earlier full run showed a single failure of `sync.spec.ts` "records when every check started, ..." while the agent environment was syncing in parallel; not reproducible in three reruns, error text not captured; unrelated to this move (the test uses no limiter).
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
`createLimiter` now lives in `app/src/lib/server/limiter.ts` (type `Limiter`), imported by `sync/queue.ts` and `admin/auth.ts`; `auth.ts` no longer depends on `sync/`, so a change to the sync queue cannot change login hashing and scripts loading `auth.ts` no longer load the queue. Its test moved to `limiter.spec.ts` and now also checks FIFO order. Lint, tests and `make agent-reset` pass.
<!-- SECTION:FINAL_SUMMARY:END -->
