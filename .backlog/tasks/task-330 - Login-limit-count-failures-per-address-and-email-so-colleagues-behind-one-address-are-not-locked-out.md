---
id: TASK-330
title: >-
  Login limit: count failures per address and email so colleagues behind one
  address are not locked out
status: Done
assignee:
  - '@claude'
created_date: '2026-11-06 22:05'
updated_date: '2026-11-06 22:40'
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
- [x] #1 Failures against one account from an address block further attempts for that account from that address after the per-pair limit
- [x] #2 Typos of different users behind one address do not block a user who has not failed, until the larger per-address limit is reached
- [x] #3 A success of one account does not reset failures counted against another account
- [x] #4 Handbook pages that state the limit are updated
- [x] #5 Specs in `auth.spec.ts` cover the pair limit, the address limit and the success case
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. auth.ts: two limits, 5 failures per client address + normalized email and 50 per client address, both taken before the password check (takeAttempt); a success gives back the address attempt and forgets the failures of its own pair only (attemptSucceeded)
2. checkCurrentPassword counts under the email of the session user
3. Specs: account limit with other accounts and clients free, client cap of 50 across accounts, success of another account keeps the pair failures (login and current password), parallel attempts, quiet period, wrong current password
4. Handbook admin.md and docker.md name the new limits
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
- auth specs, login, account, OIDC routes and access.spec pass (143 tests); make handbook passes.
- The TASK-306 hole stays closed: a success forgets only its own pair, so guesses against another account stay counted (5 per 15 minutes per address).
- 5 and 50 are my choice from the task's suggestion; they are named constants in auth.ts.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Failed logins are now limited per client address and account (5 in 15 minutes) and per client address across accounts (50 in 15 minutes) instead of 10 per address. Colleagues behind one office address no longer lock each other out with a few typos, while guessing one account's password stays limited to 5 attempts per address, and a success forgets only the failures for its own account. Specs in auth.spec.ts cover both limits and the success case; the handbook states the limits.
<!-- SECTION:FINAL_SUMMARY:END -->
