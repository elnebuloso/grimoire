---
id: TASK-184
title: Show the error page for access errors raised in the hooks
status: Done
assignee:
  - '@claude'
created_date: '2026-10-30 21:27'
updated_date: '2026-10-30 22:22'
labels:
  - admin
milestone: m-0
dependencies: []
priority: medium
type: bug
ordinal: 246000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Found during TASK-183. `handleAccess` in `app/src/hooks.server.ts` throws `error(404)` and `error(403)` from a handle (404 on `/setup` once the admin exists, 403 for a user whose role may not open a page). SvelteKit answers errors thrown in `handle` through `handle_fatal_error`, which always renders its static fallback page (`static_error_page`), never `src/routes/+error.svelte`. The visitor sees an unstyled English page titled e.g. "Error: 403", without the header, the robots meta tag or the `X-Robots-Tag` header. `docs/handbook/admin.md` promises `You may not open this page.`, which never shows. The same applies to `redirect()` thrown there: it carries no `X-Robots-Tag` (accepted in TASK-183, nothing indexable).

The access decision has to reach the visitor through the normal render path, so `+error.svelte` renders in the page language with the layout. Keep what the comment on `handleAccess` guards against: the decision is taken on the matched route id (`event.route.id`), not on the raw pathname, and it must still cover every guarded route, including `+server` endpoints if any exist under a guarded prefix. Read `app/src/lib/server/admin/access.ts` and `app/src/routes/access.spec.ts` first.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 A logged-in user whose role may not open a page gets status 403 and `+error.svelte` with "You may not open this page.", the layout and the title "Access denied – grimoire", in the page language
- [x] #2 `/setup` after the setup gets status 404 and `+error.svelte` with the title "Page not found – grimoire"
- [x] #3 Both responses carry `<meta name="robots" content="noindex, nofollow">` and `X-Robots-Tag: noindex, nofollow`
- [x] #4 Access is still decided on the matched route, every guarded route and endpoint stays guarded, and `access.spec.ts` passes unchanged in what it asserts
- [x] #5 An e2e test covers the 403 page for a non-admin user and the 404 on `/setup`
- [x] #6 `make lint`, `make test` and `make e2e` pass
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. handleAccess: for a denied plain GET page view (not a data request, route has a +page and no +server), set locals.accessDenied and resolve; everything else still throws in the hook
2. A load below the root layout throws it (manage/+layout.server.ts, setup/+page.server.ts), so +error.svelte renders in the layout; root layout load errors would fall back to the static page
3. Fail closed: a response that does not carry the denied status is discarded and the hook throws
4. access.spec.ts for deferral and actions, e2e for 403 and finished setup
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
- Errors thrown in handle and in the root layout load always render SvelteKit's static_error_page (respond.js / page/index.js), hence the deferral to a nested load.
- PAGE_ROUTES from import.meta.glob of +page.svelte minus +server.ts routes; route ids include groups, so they match event.route.id.
- Form actions and data requests are still denied in the hook: actions run before any load.
- Checked by hand in the agent environment with a role-less user: page view 403 with layout and title, action 403, __data.json 403, /setup 404 with layout.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Pages the access check denies now render +error.svelte in the layout instead of SvelteKit's bare fallback page: a plain GET page view leaves the 403/404 to a load below the root layout (manage/+layout.server.ts, setup/+page.server.ts); form actions, data requests and endpoints are still denied in the hook, and a page whose load would not throw the error is never served (fail closed). Verified: access.spec.ts (deferral, actions), e2e for 403 as a role-less user and 404 on /setup with title, robots meta and header; make lint, make test (697), make e2e (23).
<!-- SECTION:FINAL_SUMMARY:END -->
