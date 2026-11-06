---
id: TASK-318
title: >-
  Spec: linking a provider is refused when the session changed since the link
  started
status: To Do
assignee: []
created_date: '2026-11-06 20:51'
labels:
  - admin
dependencies: []
references:
  - app/src/routes/account/link/+server.ts
  - app/src/lib/server/oidc/cookie.ts
priority: medium
type: task
ordinal: 380000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
`GET` in `app/src/routes/account/link/+server.ts` finishes linking a login provider identity to an account only when the session hash sealed in the link cookie (`LINK_COOKIE`) matches the current session (`sha256(session) !== link.session` refuses). This prevents an identity confirmed for user A from being linked to user B when the browser's session changes within the cookie's 60 seconds (logging out and in as someone else, or opening an invitation link).

No spec covers this route; the e2e test "links a provider to an existing account…" in `app/src/routes/manage/manage.e2e.ts` walks only the happy path. Deleting the comparison passes every test.

Found by a whole-repo audit on 2026-11-06 (commit 601c588 plus six local refactor commits).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 A route spec with a valid sealed link cookie and a different session cookie expects a 303 to `/account?problem=oidc-failed`
- [ ] #2 In that case no row is added to `user_identities`
- [ ] #3 The spec fails when the session comparison is removed
<!-- AC:END -->
