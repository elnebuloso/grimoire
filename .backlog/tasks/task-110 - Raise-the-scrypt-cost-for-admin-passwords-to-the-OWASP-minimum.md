---
id: TASK-110
title: Raise the scrypt cost for admin passwords to the OWASP minimum
status: To Do
assignee:
  - '@claude'
created_date: '2026-10-30 07:53'
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
- [ ] #1 Passwords are hashed with scrypt at N=2^17, r=8, p=1 or whatever the current OWASP cheat sheet names as minimum
- [ ] #2 The stored hash carries its scrypt parameters, and `passwordMatches` verifies with the parameters stored in the hash, so a later cost change does not break existing hashes
- [ ] #3 A test shows a hash made with other parameters than the current ones still verifies
- [ ] #4 The time per hash at the new cost is measured on the development machine and recorded in the implementation notes
- [ ] #5 `make test` and `make e2e` pass; login works in the agent environment after `make agent-reset`
<!-- AC:END -->
