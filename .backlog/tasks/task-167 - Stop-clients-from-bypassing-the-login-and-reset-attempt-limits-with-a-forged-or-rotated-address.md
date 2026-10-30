---
id: TASK-167
title: >-
  Stop clients from bypassing the login and reset attempt limits with a forged
  or rotated address
status: To Do
assignee: []
created_date: '2026-10-30 16:13'
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
- [ ] #1 The Docker example publishes the port on `127.0.0.1` only
- [ ] #2 The handbook says that with `ADDRESS_HEADER` set, only the proxy may reach the port
- [ ] #3 IPv6 clients are limited per `/64`, covered by a test
- [ ] #4 The cost of one attempt-limit check does not grow with the number of tracked clients
<!-- AC:END -->
