---
id: TASK-203
title: >-
  Entering a new Git token after a changed TOKEN_ENCRYPTION_KEY crashes the
  source form
status: Done
assignee:
  - '@claude'
created_date: '2026-10-31 01:36'
updated_date: '2026-10-31 01:45'
labels:
  - admin
  - sync
dependencies: []
references:
  - app/src/lib/server/admin/source-access.ts
  - 'app/src/routes/manage/sources/[id]/+page.server.ts'
documentation:
  - docs/handbook/database.md
priority: high
type: bug
ordinal: 265000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The handbook (`docs/handbook/database.md`, section "Encryption key") tells operators: with another `TOKEN_ENCRYPTION_KEY` the server starts, "but every source with a token fails to sync until an admin enters its token again". That recovery path is broken.

`checkSourceAccess` in `app/src/lib/server/admin/source-access.ts` (the `storedToken` assignment, around lines 51-54) decrypts the stored token whenever one exists and "remove token" is not ticked — even when the admin has just typed a new token, which then wins anyway. With a changed key, `decryptToken` (`app/src/lib/server/token-encryption.ts`) throws, and the `save` and `test` actions in `app/src/routes/manage/sources/[id]/+page.server.ts` answer with a 500 page. The only way out today is to also tick "remove token", which nothing tells the admin.

Reproduce: store a source with a token under key A, restart with key B, open the source, type a new token, click save or test → 500.

Found in the code audit of 2026-10-31.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Saving a source with a newly entered token succeeds when the stored token was encrypted with another `TOKEN_ENCRYPTION_KEY`
- [x] #2 The access test with a newly entered token works in the same situation
- [x] #3 Testing or saving without a new token while the stored one cannot be decrypted shows a message in the form instead of a 500
- [x] #4 A test in `app/src/lib/server/admin/source-access.spec.ts` stores a token under one key and checks access with another key; it fails before the fix
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. In checkSourceAccess (app/src/lib/server/admin/source-access.ts) decrypt the stored token only when no new token is entered and removal is not asked for.
2. Catch a failed decryption there and return a form error (new message key error_stored_token_unreadable in every app/messages/<locale>.json) instead of throwing.
3. Tests in source-access.spec.ts: token stored under one key, checked with another key, with a new token (succeeds) and without (form error); both fail before the fix.
4. Run source-access.spec.ts, then --changed.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Verified in the agent environment with a token stored under a foreign key: test without a new token and save with a changed URL both answer the new form message (no 500); save with a new token reaches the Git server with it (GitHub refused the made-up token, as expected). Both new tests in source-access.spec.ts failed before the fix with the decryption error.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
checkSourceAccess decrypts the stored token only when it is used (no new token entered, removal not asked for). A stored token that cannot be decrypted returns the new form error error_stored_token_unreadable (en, de) instead of throwing, so the save and test actions no longer answer with a 500 after a change of TOKEN_ENCRYPTION_KEY, and entering the token again repairs the source as the handbook says. Tests: two new cases in source-access.spec.ts (new token succeeds; no token gives the form error), make test --changed green, checked by hand in the agent environment.
<!-- SECTION:FINAL_SUMMARY:END -->
