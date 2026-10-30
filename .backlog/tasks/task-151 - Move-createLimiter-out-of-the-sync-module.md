---
id: TASK-151
title: Move createLimiter out of the sync module
status: To Do
assignee:
  - '@claude'
created_date: '2026-10-30 13:41'
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
- [ ] #1 `createLimiter` lives in a module outside `sync/` and `admin/`, imported by both `sync/queue.ts` and `admin/auth.ts`
- [ ] #2 `admin/auth.ts` no longer imports anything from `sync/`
- [ ] #3 The limiter behaves as before (FIFO, given concurrency); existing tests pass and the scripts in `scripts/` still run with plain node
<!-- AC:END -->
