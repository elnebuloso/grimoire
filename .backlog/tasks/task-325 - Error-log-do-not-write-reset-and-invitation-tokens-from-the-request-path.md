---
id: TASK-325
title: 'Error log: do not write reset and invitation tokens from the request path'
status: Done
assignee:
  - '@claude'
created_date: '2026-11-06 22:05'
updated_date: '2026-11-06 22:09'
labels:
  - admin
  - ops
dependencies: []
references:
  - app/src/hooks.server.ts
  - app/src/routes/access.spec.ts
priority: high
type: bug
ordinal: 387000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
`handleError` in `app/src/hooks.server.ts` logs every unexpected error as `` `${event.request.method} ${event.url.pathname} failed` ``. For `/login/reset/[token]` and `/invite/[token]` the pathname contains the secret token. Any unexpected error on these routes – e.g. `SQLITE_BUSY` while another writer holds the lock – writes the live token into the log, which is often shipped to log storage readable by more people than the admins. A reset token is valid 60 minutes (24 hours when an admin creates the link, `app/src/lib/server/auth/password-reset.ts`); an invitation token 7 days (`app/src/lib/server/admin/invitations.ts`). Whoever reads the log can set that user's password or take over the invited account with its roles.

`app/src/lib/server/agent/http.ts` and `app/src/lib/server/agent/mcp.ts` log paths the same way, but their paths carry no secrets.

Suggested fix: log `event.route.id ?? event.url.pathname` (the route pattern, e.g. `/login/reset/[token]`) instead of the pathname, and adjust the expectation in `app/src/routes/access.spec.ts` (around line 486, `POST /manage/sources/... failed`).

Found by the second whole-repo audit on 2026-11-06 (HEAD 06aada8).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 An unexpected error on `/login/reset/<token>` or `/invite/<token>` is logged without the token
- [x] #2 Errors on other routes are still logged with method and route
- [x] #3 A spec covers an error on the reset route and asserts the logged line
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Specs: handleError logs the route ID; for /login/reset/<token> the token is not in the line; without a matched route the address is logged
2. hooks.server.ts logs event.route.id ?? event.url.pathname
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
- The two route specs failed before and pass after; access.spec.ts passes (27 tests).
- The agent routes (http.ts, mcp.ts) keep logging their path: /mcp, /query, /sources/…, /p/… carry no secrets.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Unexpected server errors are now logged with the route pattern (e.g. POST /login/reset/[token] failed) instead of the address, so reset and invitation tokens no longer reach the log; requests no route matched still log their address. Specs in access.spec.ts cover the reset route, a normal route and an unmatched request.
<!-- SECTION:FINAL_SUMMARY:END -->
