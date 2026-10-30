---
id: TASK-101
title: Hash passwords with async scrypt so a login does not block the server
status: To Do
assignee:
  - '@claude'
created_date: '2026-10-30 02:59'
labels:
  - admin
milestone: m-0
dependencies: []
references:
  - app/src/lib/server/admin/auth.ts
priority: medium
type: bug
ordinal: 163000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Found by a code review of the management area on 2026-10-30 (cost not measured).

`passwordMatches` in `app/src/lib/server/admin/auth.ts` (around lines 61 and 68) uses `scryptSync`, and `login` (around line 150) runs it for unknown usernames too, deliberately, so that the answer time does not reveal whether a user exists. Every POST to `/login` therefore blocks the Node event loop for one scrypt with Node's default cost (N=16384, r=8). The block after 10 failures is per client address, so requests from many addresses are not slowed down. While a burst of login requests is processed, agent queries, MCP and the management area all wait. The time per call has not been measured; tens of milliseconds is a guess for typical hardware.

The asynchronous `crypto.scrypt` from the Node standard library runs on the libuv thread pool and keeps the event loop free; promisified it is a drop-in. `login` and `changePassword` become async, and so do their callers (routes and `scripts/`, which load `auth.ts` with plain Node).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Password hashing and checking no longer use `scryptSync`; no synchronous scrypt is left in `auth.ts`
- [ ] #2 Unknown usernames still go through one scrypt, so the timing does not reveal whether a user exists
- [ ] #3 Login, setup, password change and the `scripts/` that use `auth.ts` keep working; existing auth tests pass
<!-- AC:END -->
