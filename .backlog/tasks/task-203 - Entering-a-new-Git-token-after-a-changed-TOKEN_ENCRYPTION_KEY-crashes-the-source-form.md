---
id: TASK-203
title: >-
  Entering a new Git token after a changed TOKEN_ENCRYPTION_KEY crashes the
  source form
status: To Do
assignee: []
created_date: '2026-10-31 01:36'
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
- [ ] #1 Saving a source with a newly entered token succeeds when the stored token was encrypted with another `TOKEN_ENCRYPTION_KEY`
- [ ] #2 The access test with a newly entered token works in the same situation
- [ ] #3 Testing or saving without a new token while the stored one cannot be decrypted shows a message in the form instead of a 500
- [ ] #4 A test in `app/src/lib/server/admin/source-access.spec.ts` stores a token under one key and checks access with another key; it fails before the fix
<!-- AC:END -->
