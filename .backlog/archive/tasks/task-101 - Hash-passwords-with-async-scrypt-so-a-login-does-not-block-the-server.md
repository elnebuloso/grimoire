---
id: TASK-101
title: Hash passwords with async scrypt so a login does not block the server
status: Done
assignee:
  - '@claude'
created_date: '2026-10-30 02:59'
updated_date: '2026-10-30 03:13'
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
- [x] #1 Password hashing and checking no longer use `scryptSync`; no synchronous scrypt is left in `auth.ts`
- [x] #2 Unknown usernames still go through one scrypt, so the timing does not reveal whether a user exists
- [x] #3 Login, setup, password change and the `scripts/` that use `auth.ts` keep working; existing auth tests pass
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Hash and check with promisified `crypto.scrypt`; `hashPassword`, `createUser`, `setupAdmin`, `login`, `changePassword` become async; routes and `scripts/agent-seed.ts` await them.
2. Compute hashes before `BEGIN IMMEDIATE`: other requests share the connection while a hash is awaited.
3. Count an attempt before the hash runs and forget it on success, so parallel attempts cannot all pass the block check.
4. Adapt auth/access specs; add a test for parallel attempts.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Making login async opened a gap the synchronous version did not have: parallel attempts from one client all passed `isBlocked` while their hashes ran. An attempt is now counted before the check (and forgotten on success); test 'blocks a client that sends its attempts in parallel just as well' covers it. Not measured: the cost of one scrypt. Checked: make lint, make test (551), make e2e (17), agent reset (plain-Node seed with async hash) and a curl login against the agent environment.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Passwords are hashed and checked with the asynchronous `crypto.scrypt`, so a login no longer blocks the event loop. Unknown usernames still pay one scrypt. Hashes are computed outside transactions, and a login attempt counts toward the block before its hash runs, so parallel attempts are blocked just like sequential ones. Routes and the seed script await the new async functions. Verified by unit, access and e2e tests, lint, a seed run and a curl login.
<!-- SECTION:FINAL_SUMMARY:END -->
