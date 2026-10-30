---
id: TASK-184
title: Show the error page for access errors raised in the hooks
status: To Do
assignee: []
created_date: '2026-10-30 21:27'
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
- [ ] #1 A logged-in user whose role may not open a page gets status 403 and `+error.svelte` with "You may not open this page.", the layout and the title "Access denied – grimoire", in the page language
- [ ] #2 `/setup` after the setup gets status 404 and `+error.svelte` with the title "Page not found – grimoire"
- [ ] #3 Both responses carry `<meta name="robots" content="noindex, nofollow">` and `X-Robots-Tag: noindex, nofollow`
- [ ] #4 Access is still decided on the matched route, every guarded route and endpoint stays guarded, and `access.spec.ts` passes unchanged in what it asserts
- [ ] #5 An e2e test covers the 403 page for a non-admin user and the 404 on `/setup`
- [ ] #6 `make lint`, `make test` and `make e2e` pass
<!-- AC:END -->
