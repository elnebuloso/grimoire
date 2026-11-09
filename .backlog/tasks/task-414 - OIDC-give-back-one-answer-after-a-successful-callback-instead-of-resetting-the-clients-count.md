---
id: TASK-414
title: >-
  OIDC: give back one answer after a successful callback instead of resetting
  the client's count
status: To Do
assignee: []
created_date: '2026-11-09 10:17'
labels:
  - admin
dependencies: []
priority: low
type: bug
ordinal: 476000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
### What this is
The OIDC callback (`app/src/routes/auth/oidc/[key]/callback/+page.server.ts`) limits each client to 30 answers in 15 minutes (`answers = createAttemptLimit(30, 15)`), because every answer costs a token request to the identity provider.

### Problem
After a successful login it calls `answers.forget(client)` (twice, in the linking and the login branch), which resets the client's whole count. A client with its own provider account can send 29 junk callbacks, log in once for real, and repeat; it is never stopped. The password login handles the same case with `giveBack`, which returns just that one attempt (`attemptSucceeded` in `app/src/lib/server/auth/auth.ts`).

### Fix
Replace both `answers.forget(client)` calls with `answers.giveBack(client)`. Add a case to `app/src/routes/auth/oidc/[key]/callback/callback.spec.ts` that mixes failures and a success and expects the 31st answer to be refused.

### If we skip it
The stated limit on callbacks does not hold; a client can make grimoire send unbounded token requests to the identity provider.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Both success paths call answers.giveBack(client)
- [ ] #2 callback.spec.ts covers failures mixed with a success and the limit still stopping the client
<!-- AC:END -->
