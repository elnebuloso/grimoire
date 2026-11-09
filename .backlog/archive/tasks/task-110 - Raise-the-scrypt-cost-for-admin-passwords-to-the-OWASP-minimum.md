---
id: TASK-110
title: Raise the scrypt cost for admin passwords to the OWASP minimum
status: Done
assignee:
  - '@claude'
created_date: '2026-10-30 07:53'
updated_date: '2026-10-30 08:00'
labels:
  - admin
milestone: m-0
dependencies: []
references:
  - app/src/lib/server/admin/auth.ts
priority: low
type: enhancement
ordinal: 172000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
`hashPassword` and `passwordMatches` in `app/src/lib/server/admin/auth.ts` call `scrypt` with Node's defaults (N=16384, r=8, p=1), measured at about 39 ms per hash on the development machine. OWASP's password storage cheat sheet names N=2^17, r=8, p=1 as the minimum for scrypt (stated from memory, check the current sheet). A stolen database is therefore cheaper to brute-force than it needs to be.

The stored format is `<salt base64>$<hash base64>` and carries no parameters, so a later change of the cost would make every stored hash unverifiable. N=2^17 with r=8 needs about 128 MiB per hash, above Node's default `maxmem` of 32 MiB, so `maxmem` has to be passed.

The app has never been released or installed anywhere: no stored hashes have to keep working, no migration or rehash-on-login is needed. Fixture and seed data (`scripts/agent-seed.ts`, `make agent-reset`) create their hashes through `hashPassword` and pick up the new format on their own.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Passwords are hashed with scrypt at N=2^17, r=8, p=1 or whatever the current OWASP cheat sheet names as minimum
- [x] #2 The stored hash carries its scrypt parameters, and `passwordMatches` verifies with the parameters stored in the hash, so a later cost change does not break existing hashes
- [x] #3 A test shows a hash made with other parameters than the current ones still verifies
- [x] #4 The time per hash at the new cost is measured on the development machine and recorded in the implementation notes
- [x] #5 `make test` and `make e2e` pass; login works in the agent environment after `make agent-reset`
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Store the hash as `scrypt$<N>$<r>$<p>$<salt>$<hash>`; `hashPassword` uses N=2^17, r=8, p=1 (OWASP sheet checked 2026-10-30), with `maxmem` derived from N and r.
2. `passwordMatches` reads N, r, p from the stored hash. No reading of the old two-part format: the app was never installed.
3. Test in `auth.spec.ts`: a hash written with other parameters still verifies.
4. Measure the time per hash; make test, make e2e, agent login after make agent-reset.

5. Tests hash with N=2^10 through a `node:crypto` mock in `app/src/test-setup.ts` (setupFiles of the server project): at the real cost the auth specs went from 6 s to 50 s with timeouts.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
OWASP Password Storage Cheat Sheet checked 2026-10-30: scrypt minimum N=2^17, r=8, p=1 (Argon2id is its first choice; scrypt is the listed alternative).
Measured on the development machine (Node 24.22.1, scryptSync): N=2^14 about 39 ms per hash, N=2^17 about 371 ms and 128 MiB per hash. A login over curl in the agent environment took 0.84 s.
Stored format: `scrypt$<N>$<r>$<p>$<salt base64>$<hash base64>`; the old two-part format is not read, the app was never installed.
`maxmem` is set to twice the memory scrypt needs, Node's default 32 MiB is below it.
The test 'verifies a hash made with other scrypt parameters than the current ones' fails when `passwordMatches` uses the current cost instead of the stored one (checked by breaking it).
Verified: make lint, make test (564), make e2e (17); after make agent-reset the agent user logs in (303 to /manage), a wrong password gets 400, and the stored hash starts with `scrypt$131072$8$1$`.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Admin passwords are hashed with scrypt at OWASP's minimum (N=2^17, r=8, p=1, about 0.37 s and 128 MiB per hash) instead of Node's defaults. The hash stores its parameters, and verification uses the stored ones, so the cost can be raised later without breaking stored hashes. Server tests hash with a smaller N through a `node:crypto` mock in `app/src/test-setup.ts` to stay fast. Risk: parallel logins each hold 128 MiB while hashing (the libuv thread pool limits it to 4 at once by default).
<!-- SECTION:FINAL_SUMMARY:END -->
