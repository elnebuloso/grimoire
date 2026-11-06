---
id: TASK-306
title: >-
  Login limit: a successful password check must not erase the failures of the
  client address
status: To Do
assignee: []
created_date: '2026-11-06 20:51'
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
- [ ] #1 After 9 failed logins, 1 successful login and 1 more failure from the same client address, the next attempt is `blocked`
- [ ] #2 The same holds when the success comes from `checkCurrentPassword`
- [ ] #3 A successful login itself does not count as a failure
- [ ] #4 Regression specs in `app/src/lib/server/auth/auth.spec.ts` fail before the fix and pass after
<!-- AC:END -->
