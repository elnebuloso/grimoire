---
id: TASK-134
title: Limit concurrent password hashing across all clients
status: To Do
assignee: []
created_date: '2026-10-30 10:55'
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
- [ ] #1 At most a small fixed number of password hashes run at once, for login, setup, password change and reset together
- [ ] #2 When the hashing queue is full, a login is answered with the existing `blocked` refusal at once instead of waiting
- [ ] #3 Setup, password change and reset still complete under normal load
- [ ] #4 A test starts more logins in parallel than the queue allows and shows the excess is refused as `blocked` without hashing
<!-- AC:END -->
