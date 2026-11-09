---
id: TASK-414
title: >-
  OIDC: give back one answer after a successful callback instead of resetting
  the client's count
status: Done
assignee:
  - '@claude'
created_date: '2026-11-09 10:17'
updated_date: '2026-11-09 10:54'
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
Replace both `answers.forget(client)` calls with `answers.giveBack(client)`. Add a case to `describe('the attempt limit of the callback')` in `app/src/routes/auth/oidc/[key]/callback/callback.spec.ts`: 29 failing answers, one successful login, then failing answers again; the client must be stopped once it has used up 30 failures. The limit is module state; the spec's `beforeEach` already calls `vi.resetModules()` so each test starts fresh, and the existing tests show how a failing and a successful answer are built.

### If we skip it
The stated limit on callbacks does not hold; a client can make grimoire send unbounded token requests to the identity provider.

### Notes for the implementer
- Commit type: `fix` (released behaviour changes), so pushing it cuts a release; afterwards write the release-notes summary per `.claude/rules/release-notes.md`.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Both success paths call answers.giveBack(client)
- [x] #2 callback.spec.ts covers failures mixed with a success and the limit still stopping the client
<!-- AC:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Both success paths of the OIDC callback now call answers.giveBack(client) instead of answers.forget(client): a success returns only its own attempt, so failures before it keep counting, as with the password login. New case in callback.spec.ts (29 failures, a success, then the limit still stops the client), confirmed to fail with forget.
<!-- SECTION:FINAL_SUMMARY:END -->
