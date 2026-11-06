---
id: TASK-318
title: >-
  Spec: linking a provider is refused when the session changed since the link
  started
status: Done
assignee:
  - '@claude'
created_date: '2026-11-06 20:51'
updated_date: '2026-11-06 21:08'
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
- [x] #1 A route spec with a valid sealed link cookie and a different session cookie expects a 303 to `/account?problem=oidc-failed`
- [x] #2 In that case no row is added to `user_identities`
- [x] #3 The spec fails when the session comparison is removed
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Route spec link.spec.ts: a sealed link cookie of one session completed by the same session links the identity, by another session is refused
2. Mutation check: the refusal spec fails with the session comparison removed
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
- link.spec.ts passes (2 tests). With `sha256(session) !== link.session` removed from +server.ts the refusal spec fails; the route is restored unchanged.
- Users are inserted with SQL, not createUser, which TASK-323 moves out of production code.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
A route spec for GET /account/link covers that a provider identity is linked only for the session that started the link: the same session links it, another session gets /account?problem=oidc-failed and no user_identities row. Removing the session comparison makes the spec fail (checked). No production code changed.
<!-- SECTION:FINAL_SUMMARY:END -->
