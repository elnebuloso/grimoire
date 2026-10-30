---
id: TASK-69
title: Management area reachable without login via a percent-encoded path
status: To Do
assignee:
  - '@claude'
created_date: '2026-10-30 00:14'
labels:
  - admin
milestone: m-0
dependencies: []
references:
  - app/src/hooks.server.ts
  - app/src/lib/server/admin/auth.ts
  - app/src/routes/access.spec.ts
priority: high
type: bug
ordinal: 131000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Found by a code review on 2026-10-30 (read only, not reproduced).

`handleAccess` (`app/src/hooks.server.ts:36-42`, with `isUnder`/`accessRedirect` in `app/src/lib/server/admin/auth.ts:283-318`) decides login and role by comparing the raw `event.url.pathname` against the prefix `/manage`. SvelteKit 3.1.0 builds `event.url` with `new URL(request.url)`, which keeps percent-escapes (`app/node_modules/@sveltejs/kit/src/runtime/server/respond.js:95`), but matches routes against `decode_pathname(...)` of that path (`respond.js:299`).

So for `/m%61nage/api-keys` the access check sees no `/manage` prefix and `accessRedirect` returns `undefined` ("serve it"), while the router decodes the path and runs the `/manage/api-keys` page and its actions. An anonymous client could POST `?/create` there and get an API key for all projects, delete projects, read source settings or pause all syncs. The CSRF origin check does not help: a non-browser client sets `Origin` freely. `app/src/routes/access.spec.ts` only tests plain paths.

Quick check in the agent environment: `curl -s http://localhost:5174/m%61nage` (should redirect to login, may serve the page instead).

Review suggestion: decide access on what the router matched (`event.route.id`, null for unmatched paths) instead of the raw string, or at least on the decoded pathname.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 A request to a percent-encoded variant of any `/manage` or `/account` path (e.g. `/m%61nage/api-keys`) without a session gets the same answer as the plain path: redirect to login, no page data, no action run
- [ ] #2 Role checks also hold for encoded paths
- [ ] #3 A regression test with an encoded path fails before the fix and passes after
<!-- AC:END -->
