---
id: TASK-306
title: >-
  Login limit: a successful password check must not erase the failures of the
  client address
status: Done
assignee:
  - '@claude'
created_date: '2026-11-06 20:51'
updated_date: '2026-11-06 20:56'
labels:
  - admin
dependencies: []
references:
  - app/src/lib/server/auth/auth.ts
  - app/src/lib/server/auth/attempt-limit.ts
priority: high
type: bug
ordinal: 368000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
`login` and `checkCurrentPassword` in `app/src/lib/server/auth/auth.ts` take an attempt from `failedLogins` (10 failures per client address in 15 minutes) before checking the password, and on success call `failedLogins.forget(clientKey(client))`. `forget` deletes every failure the address made, against any account.

Case: an attacker with any ordinary account (e.g. an invited user without a role) sends 9 wrong passwords for `admin@example.com` from one address, then logs in once with their own correct password: the counter is back at 0. Repeating this, 90 % of all attempts are guesses against the admin, limited only by `MAX_PENDING_HASHES` parallel scrypt hashes, not by 10 per 15 minutes. A logged-in attacker can do the same through `checkCurrentPassword` (e.g. `POST /account/link`, which asks for the current password). The existing spec "blocks a client for 15 minutes after 10 failures" in `auth.spec.ts` never mixes in a success, so nothing catches this.

Suggested fix: on success call `failedLogins.giveBack(clientKey(client))` (exists in `app/src/lib/server/auth/attempt-limit.ts`) instead of `forget`, so the successful attempt just does not count and earlier failures stay. Trade-off to note in the task: users behind one NAT address share the 10 failures per 15 minutes; if that matters, a second limit per client + email can be added.

Found by a whole-repo audit on 2026-11-06 (commit 601c588 plus six local refactor commits).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 After 9 failed logins, 1 successful login and 1 more failure from the same client address, the next attempt is `blocked`
- [x] #2 The same holds when the success comes from `checkCurrentPassword`
- [x] #3 A successful login itself does not count as a failure
- [x] #4 Regression specs in `app/src/lib/server/auth/auth.spec.ts` fail before the fix and pass after
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Specs: 9 failures, a success to another account (login and checkCurrentPassword), one more failure is still answered, the next is blocked
2. login and checkCurrentPassword call failedLogins.giveBack instead of forget
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
- Both specs failed before (the 11th attempt was answered) and pass after.
- The tenth attempt answering wrong-credentials after the success shows the success itself is not counted.
- The OIDC callback still forgets its own answer limit on success: that limit counts provider answers, where no password can be guessed, so it is left as it is.
- auth.spec.ts, attempt-limit.spec.ts and the login and account route specs pass (80 tests).
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
A successful login or current-password check now takes back only its own attempt instead of erasing every failure of the client address, so a client with one account can no longer reset the 10-failures-per-15-minutes limit while guessing another account's password. Two regression specs in auth.spec.ts fail before and pass after. Trade-off unchanged from before: clients behind one address share the limit.
<!-- SECTION:FINAL_SUMMARY:END -->
