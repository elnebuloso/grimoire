---
id: TASK-69
title: Management area reachable without login via a percent-encoded path
status: Done
assignee:
  - '@claude'
created_date: '2026-10-30 00:14'
updated_date: '2026-10-30 00:17'
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
- [x] #1 A request to a percent-encoded variant of any `/manage` or `/account` path (e.g. `/m%61nage/api-keys`) without a session gets the same answer as the plain path: redirect to login, no page data, no action run
- [x] #2 Role checks also hold for encoded paths
- [x] #3 A regression test with an encoded path fails before the fix and passes after
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Pass event.route.id (the route the router matched after decoding) to accessRedirect instead of event.url.pathname; serve unmatched paths (route.id null), which end in 404.
2. Regression test in access.spec.ts with an encoded path; verify in the agent environment with curl.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Reproduced before the fix in the agent environment: GET /m%61nage and /m%61nage/api-keys answered 200 without a session, and POST /m%61nage/api-keys?/create ran the action (it only failed on form validation). After the fix all of them answer a redirect to /login, also /m%61nage/__data.json. Role checks run on the same route ID, so AC 2 holds by the same code path; route IDs keep static prefixes like /manage, so PAGE_ROLES needs no change. The new test fails with the old hooks.server.ts and passes with the new one.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
handleAccess now decides login and role on event.route.id, the route SvelteKit matched on the decoded path, instead of the raw event.url.pathname. Percent-encoded variants such as /m%61nage/api-keys were served and their actions ran without a session; they now redirect to /login like the plain path. Unmatched paths (route.id null) are served and end in 404. Verified with a regression test (fails before, passes after), curl against the agent environment, make lint and make test (454 passed).
<!-- SECTION:FINAL_SUMMARY:END -->
