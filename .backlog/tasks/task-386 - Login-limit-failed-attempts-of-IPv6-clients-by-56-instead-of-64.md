---
id: TASK-386
title: 'Login: limit failed attempts of IPv6 clients by /56 instead of /64'
status: Done
assignee:
  - '@claude'
created_date: '2026-11-08 16:45'
updated_date: '2026-11-08 18:30'
labels:
  - admin
dependencies: []
priority: medium
type: bug
ordinal: 448000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Failed logins are limited to 50 per client and 5 per client and account in 15 minutes. `clientKey` in `app/src/lib/server/auth/attempt-limit.ts:42-63` keys an IPv6 address by its /64. In addition, at most 16 password hashes may wait or run at once across all clients (`PARALLEL_HASHES = 2`, `MAX_PENDING_HASHES = 16` in `app/src/lib/server/auth/auth.ts`); beyond that every login answers `blocked`.

Case: grimoire is reachable over IPv6 with the real client address. A home connection with the usual /56 delegation holds 256 /64 networks: 256 × 50 = 12,800 attempts per 15 minutes (about 14 per second) and 256 × 5 = 1,280 guesses per account instead of 5. Two scrypt hashes at N=2^17 handle an estimated 5 per second (not measured), so the queue stays full and every other user's password login, and every check of the current password, is `blocked` while the attack runs. Over IPv4 nothing changes.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 clientKey keys an IPv6 address by its /56; IPv4 and IPv4-mapped addresses stay as they are
- [x] #2 The spec of clientKey in attempt-limit.spec.ts covers two addresses in different /64 of one /56 sharing a key, and addresses in different /56 not sharing one
- [x] #3 The comment above clientKey states the reason for /56
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. clientKey masks the fourth group to its top 8 bits and keys by /56.
2. Spec cases and handbook sentence in admin.md updated.
<!-- SECTION:PLAN:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Failed logins from IPv6 clients are now counted per /56 instead of /64, so a home connection can no longer multiply the limits by 256 by rotating through its /64 networks. IPv4 and IPv4-mapped addresses unchanged. Spec and handbook updated; make test --changed: 205 passed.
<!-- SECTION:FINAL_SUMMARY:END -->
