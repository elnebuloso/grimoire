---
id: TASK-353
title: 'Headers: forbid framing the app (frame-ancestors, X-Frame-Options)'
status: To Do
assignee: []
created_date: '2026-11-06 23:46'
labels:
  - admin
  - ops
dependencies: []
references:
  - app/src/hooks.server.ts
priority: medium
type: bug
ordinal: 415000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
`handleRobots` in `app/src/hooks.server.ts` (around lines 52-56) sets only `X-Robots-Tag`; no response carries a Content-Security-Policy, `frame-ancestors` or `X-Frame-Options` (checked with `curl -I /login`), and `app/vite.config.ts` / the SvelteKit config set no `csp` option.

Case: the session cookie is `SameSite=Strict` (`app/src/lib/server/auth/auth.ts`), which still sends it within the same site. A page on a sibling subdomain of the organisation's domain – typically a documentation site built from a repository anyone can push to, the kind grimoire indexes – can frame `/manage/users` with an admin's session and trick a click on Delete and then Confirm (clickjacking). Not tried end to end.

Suggested fix: set `Content-Security-Policy: frame-ancestors 'none'` and `X-Frame-Options: DENY` on every response (e.g. next to `X-Robots-Tag`). A full `script-src` policy through the SvelteKit `csp` option is a larger follow-up; note that `app/src/app.html` uses an inline `style`.

Found by the third whole-repo audit on 2026-11-07 (HEAD 4a72798).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Every response carries `Content-Security-Policy: frame-ancestors 'none'` and `X-Frame-Options: DENY`
- [ ] #2 Pages, agent routes and downloads work as before (e2e passes)
- [ ] #3 A spec in `access.spec.ts` (next to the robots header spec) covers the headers
<!-- AC:END -->
