---
id: TASK-325
title: 'Error log: do not write reset and invitation tokens from the request path'
status: To Do
assignee: []
created_date: '2026-11-06 22:05'
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
- [ ] #1 An unexpected error on `/login/reset/<token>` or `/invite/<token>` is logged without the token
- [ ] #2 Errors on other routes are still logged with method and route
- [ ] #3 A spec covers an error on the reset route and asserts the logged line
<!-- AC:END -->
