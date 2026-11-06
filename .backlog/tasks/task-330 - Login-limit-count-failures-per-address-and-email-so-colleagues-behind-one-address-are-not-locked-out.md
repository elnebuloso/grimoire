---
id: TASK-330
title: >-
  Login limit: count failures per address and email so colleagues behind one
  address are not locked out
status: To Do
assignee: []
created_date: '2026-11-06 22:05'
labels:
  - admin
dependencies: []
references:
  - app/src/lib/server/auth/auth.ts
  - app/src/lib/server/auth/attempt-limit.ts
  - docs/handbook/admin.md
priority: medium
type: bug
ordinal: 392000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
`login` and `checkCurrentPassword` in `app/src/lib/server/auth/auth.ts` take an attempt from `failedLogins` (10 per client address in 15 minutes, `createAttemptLimit` in `app/src/lib/server/auth/attempt-limit.ts`) before checking the password. Since TASK-306, a success only gives back its own attempt (`giveBack`) instead of forgetting all failures of the address, so one account can no longer reset the count while guessing another's password.

Side effect: users behind one NAT or proxy address (an office, a VPN) now share 10 failures per 15 minutes. Case: 200 colleagues behind one address make 10 typos within 15 minutes in total; from then on every login from that address is `blocked`, correct passwords included. Before TASK-306, each success in between reset the counter. The handbook (`docs/handbook/admin.md`, `docs/handbook/docker.md`) describes the per-address limit.

Suggested fix: add a second limit per client address + normalized email (e.g. 5 per 15 minutes) and make the per-address limit larger (e.g. 50); a success forgets the failures of its own address + email pair only. The TASK-306 regression specs (9 failures against another account, a success, then blocked) must keep holding against the address limit's intent – adjust their numbers to the new limits.

Found by the second whole-repo audit on 2026-11-06 (HEAD 06aada8).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Failures against one account from an address block further attempts for that account from that address after the per-pair limit
- [ ] #2 Typos of different users behind one address do not block a user who has not failed, until the larger per-address limit is reached
- [ ] #3 A success of one account does not reset failures counted against another account
- [ ] #4 Handbook pages that state the limit are updated
- [ ] #5 Specs in `auth.spec.ts` cover the pair limit, the address limit and the success case
<!-- AC:END -->
