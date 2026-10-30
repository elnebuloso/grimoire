---
id: TASK-134
title: Limit concurrent password hashing across all clients
status: Done
assignee:
  - '@claude'
created_date: '2026-10-30 10:55'
updated_date: '2026-10-30 11:06'
labels:
  - admin
milestone: m-0
dependencies: []
priority: high
type: bug
ordinal: 196000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Found in the second whole-project code review of 2026-10-30. Every login, also for an unknown address, runs scrypt with `N = 2^17, r = 8` (`COST` in `app/src/lib/server/admin/auth.ts` around line 73): 128 MiB and about 0.5 s per hash. It runs on the libuv thread pool (4 threads by default), which also serves file system calls (static files, `mkdtemp` and `rm` of every sync) and DNS lookups (`fetchInclude`). Measured: an `fs.stat` queued behind eight hashes waited 929 ms. The only brake is per client (`isBlocked`, `recordFailedLogin`: 10 attempts, then a block), so anyone with many source addresses (an IPv6 prefix gives plenty) is not slowed at all and needs no credentials; each address also adds an entry to `failedLogins`, which every login scans. An internet-facing instance can thus be held at 4 x 128 MiB of hashing memory, with static assets, syncs and the admin login itself waiting behind it. Hashing happens in `login`, setup, `changePassword` and the password reset (`app/src/lib/server/admin/password-reset.ts`). `createLimiter` in `app/src/lib/server/sync/queue.ts` (around line 29) already limits concurrent work. The per-client counter stays as it is.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 At most a small fixed number of password hashes run at once, for login, setup, password change and reset together
- [x] #2 When the hashing queue is full, a login is answered with the existing `blocked` refusal at once instead of waiting
- [x] #3 Setup, password change and reset still complete under normal load
- [x] #4 A test starts more logins in parallel than the queue allows and shows the excess is refused as `blocked` without hashing
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Wrap every scrypt call (scryptWith) in createLimiter(2) from sync/queue.ts, so hashing leaves two of the four pool threads to file and DNS calls; count pending hashes.
2. login and changePassword answer blocked when 16 hashes are pending, before counting a failure; setup and reset just wait in the limiter.
3. Test: 17 parallel logins from different clients against a cheap stored hash; the 17th is blocked.
<!-- SECTION:PLAN:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
All password hashing in admin/auth.ts (login, setup, change, reset) now runs through one limiter: 2 hashes at a time (PARALLEL_HASHES), so two of the four default pool threads stay free for file and DNS calls. While 16 hashes are pending (MAX_PENDING_HASHES), login and password change answer `blocked` at once without hashing; the per-client counter is unchanged. New test: 17 parallel logins from different clients, 16 get wrong-credentials, the 17th is blocked, and a later login succeeds; it fails against the old code. 249 admin and route specs pass; auth.ts still loads with plain node for scripts/reset-admin.ts.
<!-- SECTION:FINAL_SUMMARY:END -->
