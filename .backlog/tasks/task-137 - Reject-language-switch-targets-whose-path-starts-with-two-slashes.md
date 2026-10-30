---
id: TASK-137
title: Reject language switch targets whose path starts with two slashes
status: To Do
assignee: []
created_date: '2026-10-30 10:55'
labels:
  - admin
milestone: m-0
dependencies: []
priority: low
type: bug
ordinal: 199000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Found in the second whole-project code review of 2026-10-30. `pathOnThisSite` in `app/src/routes/language/+server.ts` (around lines 21-26) resolves `redirectTo` with `new URL(target, url)`, checks the origin and redirects to `resolved.pathname + search + hash`. A target such as `/.//evil.example` or `/a/..//evil.example` resolves to the same origin with the pathname `//evil.example`; the browser reads that `Location` as protocol-relative and goes to `https://evil.example/`. A second gap: `http://[x` makes `new URL` throw, which becomes a 500 logged as an unexpected error. SvelteKit rejects cross-site form POSTs, so another site cannot trigger this today, but the guard comment claims it prevents an open redirect, and a change to the CSRF setup (such as `trustedOrigins`) would make it reachable. Tests are in `app/src/routes/language/language.spec.ts`.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 A target that resolves to a pathname starting with `//` redirects to `/`
- [ ] #2 A target `new URL` cannot parse redirects to `/` instead of failing with 500
- [ ] #3 The spec covers `/.//evil.example`, `/a/..//evil.example` and `http://[x` next to the existing cases
<!-- AC:END -->
