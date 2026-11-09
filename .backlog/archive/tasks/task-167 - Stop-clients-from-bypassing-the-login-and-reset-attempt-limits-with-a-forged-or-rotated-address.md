---
id: TASK-167
title: >-
  Stop clients from bypassing the login and reset attempt limits with a forged
  or rotated address
status: Done
assignee:
  - '@claude'
created_date: '2026-10-30 16:13'
updated_date: '2026-10-30 16:28'
labels:
  - ops
  - admin
milestone: m-0
dependencies: []
priority: medium
type: bug
ordinal: 229000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The failed-login limit (10 per client and 15 minutes, `app/src/lib/server/admin/auth.ts`) and the reset-request limit (5 per client and hour, `app/src/lib/server/admin/password-reset.ts`) are keyed by the client address. The "Docker without Compose" example in `docs/handbook/docker.md` sets `ADDRESS_HEADER=x-forwarded-for` and `--publish 3000:3000`, which publishes the port on every host interface. adapter-node then takes the client address from the last `X-Forwarded-For` entry, so anyone reaching port 3000 directly sets the header and counts as a new client on every request; the brute-force limit shrinks to the speed of the two parallel scrypt hashes. The "Reverse proxy" section says to set the header only when the proxy sends it, not that the port must then be reachable only from the proxy. An IPv6 client gets the same effect without any header by rotating through its own `/64`. Every new key stays in the in-memory map for the window, and `take` (`app/src/lib/server/admin/attempt-limit.ts`) scans the whole map on each call, so cost per request grows with the number of keys.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 The Docker example publishes the port on `127.0.0.1` only
- [x] #2 The handbook says that with `ADDRESS_HEADER` set, only the proxy may reach the port
- [x] #3 IPv6 clients are limited per `/64`, covered by a test
- [x] #4 The cost of one attempt-limit check does not grow with the number of tracked clients
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. `clientKey` in `attempt-limit.ts`: IPv6 addresses keyed by their `/64`, IPv4-mapped as IPv4, everything else unchanged; used for the failed-login and reset-request limits
2. Keep the map ordered by latest attempt, so expiry visits only expired keys
3. Handbook: Docker example on `127.0.0.1`, proxy-only rule under Reverse proxy, `/64` note in admin.md
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Measured with a scratch script (Node 24.22.1): 1,000 `take` calls with 100,000 live keys took 3,651 ms before and 1.1 ms after the change.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Login and reset limits now key IPv6 clients by their `/64` (`clientKey` in `app/src/lib/server/admin/attempt-limit.ts`), so rotating addresses within one network no longer resets the count. The attempt map stays ordered by each key's latest attempt, so a check removes only expired keys instead of scanning all: 1,000 checks with 100,000 tracked clients went from 3,651 ms to 1.1 ms. Handbook: the Docker example publishes on `127.0.0.1`, "Reverse proxy" says only the proxy may reach the port once `ADDRESS_HEADER` is set, and `admin.md` says one `/64` counts as one client. Verified: new `attempt-limit.spec.ts` (window, ordering, address keys), admin, login, account and setup tests green; `make handbook` strict.
<!-- SECTION:FINAL_SUMMARY:END -->
