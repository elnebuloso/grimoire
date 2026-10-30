---
id: TASK-137
title: Reject language switch targets whose path starts with two slashes
status: Done
assignee:
  - '@claude'
created_date: '2026-10-30 10:55'
updated_date: '2026-10-30 11:13'
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
- [x] #1 A target that resolves to a pathname starting with `//` redirects to `/`
- [x] #2 A target `new URL` cannot parse redirects to `/` instead of failing with 500
- [x] #3 The spec covers `/.//evil.example`, `/a/..//evil.example` and `http://[x` next to the existing cases
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
pathOnThisSite uses URL.parse (null instead of a throw for unparsable targets) and falls back to "/" when the origin differs or the resolved pathname starts with "//". Spec gets the three new cases.
<!-- SECTION:PLAN:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
The language switch now redirects to "/" when the resolved path starts with "//" (from targets such as "/.//evil.example" or "/a/..//evil.example", which browsers read as another host) and when the target cannot be parsed ("http://[x" made new URL throw a 500). The spec covers all three; they fail against the old guard and pass now, with the six earlier cases.
<!-- SECTION:FINAL_SUMMARY:END -->
