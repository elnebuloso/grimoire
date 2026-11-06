---
id: TASK-344
title: 'Login limit: a refused attempt must not leave an entry in the per-account map'
status: Done
assignee:
  - '@claude'
created_date: '2026-11-06 23:46'
updated_date: '2026-11-06 23:52'
labels:
  - admin
dependencies: []
references:
  - app/src/lib/server/auth/auth.ts
  - app/src/lib/server/auth/attempt-limit.ts
priority: high
type: bug
ordinal: 406000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Since TASK-330, `takeAttempt` in `app/src/lib/server/auth/auth.ts` (around lines 79-86) takes an attempt from `failedAccountLogins` (key `accountKey(client, email)` = `<clientKey> <normalized email>`) first and only then from `failedLogins` (per client address). When the client limit refuses, it calls `failedAccountLogins.giveBack(key)`. `giveBack` in `app/src/lib/server/auth/attempt-limit.ts` only pops the timestamp and leaves the key with an empty array in the map. The map's cleanup in `take` walks entries in order and stops at the first one still inside the 15-minute window, so these empty entries stay for up to 15 minutes.

Case: a client already blocked by the client limit (50 failures) keeps posting `/login` with random long emails. No password is hashed for a refused attempt, and the email has no length limit (`app/src/routes/login/+page.server.ts` passes `data.get('email')` as is; adapter-node accepts bodies up to 512 KB). Measured with the real `login()` and a stub database: 50 failures, then 20,000 blocked logins with 10 KB emails grow the heap by 206 MB. One address can run the single server process out of memory. Before TASK-330, a blocked request stored nothing.

Suggested fix: take the client limit first; when the account limit then refuses, give the client attempt back (`failedLogins.giveBack(clientKey(client))`), so a blocked client never touches the account map. Also cut the email in `accountKey` to 320 characters. Optionally let `giveBack` delete a key whose list became empty.

Found by the third whole-repo audit on 2026-11-07 (HEAD 4a72798).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 A login refused by the client limit adds no entry to the per-account map
- [x] #2 A login refused by the account limit does not count against the client limit
- [x] #3 The per-account key uses at most 320 characters of the email
- [x] #4 The existing login-limit specs in `auth.spec.ts` still pass, and a spec covers many refused logins with different emails leaving the map size unchanged
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. attempt-limit.ts: giveBack deletes a key whose list became empty; `size` tells how many keys are kept (for specs)
2. auth.ts takeAttempt takes the client limit first and gives the client attempt back when the account limit refuses; accountKey uses at most 320 characters of the email
3. Specs: attempt-limit drops a given-back key; 200 blocked logins with 10 KB emails leave the number of kept keys unchanged (auth.spec wraps createAttemptLimit to see the limits); emails sharing 320 characters count as one account
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
- The auth spec fails with the deletion in giveBack removed (checked) and passes with it; the old order alone also left keys.
- auth, attempt-limit, password-reset, login, account, OIDC and access specs pass (145 tests).
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
A login the client limit refuses no longer leaves an entry in the per-account map: the client limit is taken first, a refused account attempt gives the client attempt back, giveBack drops keys that became empty, and the key uses at most 320 characters of the email. A blocked client sending logins with endless long emails can no longer grow the server's memory. Specs cover the kept keys after 200 blocked logins, the empty-key cleanup and the 320-character key.
<!-- SECTION:FINAL_SUMMARY:END -->
