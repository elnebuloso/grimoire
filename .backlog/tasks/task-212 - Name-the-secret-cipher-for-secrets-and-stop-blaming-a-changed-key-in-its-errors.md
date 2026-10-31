---
id: TASK-212
title: >-
  Name the secret cipher for secrets and stop blaming a changed key in its
  errors
status: Done
assignee:
  - '@claude'
created_date: '2026-10-31 13:06'
updated_date: '2026-10-31 13:18'
labels:
  - admin
  - sync
milestone: m-1
dependencies: []
priority: medium
type: enhancement
ordinal: 274000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Since `ENCRYPTION_KEY` replaced `TOKEN_ENCRYPTION_KEY` with one derived key per purpose (`sourceTokens`, `formSecrets`), `app/src/lib/server/token-encryption.ts` encrypts every secret the instance holds, but it is still named for tokens:

- the module is `token-encryption.ts` and its functions are `encryptToken`/`decryptToken`; `readFormSecret` in `app/src/lib/server/admin/form-secret.ts` already uses them for something that is not a stored token.
- the error `decryptToken` throws (~line 47) says the "access token cannot be decrypted".

The derivation also changed the key protecting stored tokens, so tokens stored before the rename can no longer be read. Both messages the operator then sees say `ENCRYPTION_KEY` has changed, even when its value was kept:

- the sync error from `decryptToken`
- `error_stored_token_unreadable` in `app/messages/en.json` (and `de.json`): "The stored access token cannot be decrypted: ENCRYPTION_KEY has changed since it was saved. Enter the token again or remove it."

The description of `ENCRYPTION_KEY` in `app/src/env.ts` (~line 26), "Key encrypting the secrets grimoire stores, today the Git access tokens of sources", leaves out the token a form carries between requests, and "today" will go stale without anyone noticing.

Cost: the next secret (an SMTP password, a webhook secret) will call `encryptToken`, and when it fails the operator is told an access token is broken, with a cause that may be wrong.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 The cipher module and its functions are named for secrets (e.g. `encryptSecret`/`decryptSecret`), and every caller is updated
- [x] #2 The error the cipher throws names no particular secret; each caller says which secret failed
- [x] #3 The sync error and `error_stored_token_unreadable` (every locale) say the stored token cannot be decrypted with the current key, without claiming that `ENCRYPTION_KEY` changed
- [x] #4 The `ENCRYPTION_KEY` description in `app/src/env.ts` covers stored source tokens and form secrets, and does not say "today"
- [x] #5 The handbook names the possible causes of an unreadable stored token wherever it explains that error
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. git mv token-encryption(.spec).ts -> secret-encryption(.spec).ts; encryptToken/decryptToken -> encryptSecret/decryptSecret; update every importer and docs/ARCHITECTURE.md.
2. decryptSecret throws a text naming no secret and not blaming ENCRYPTION_KEY.
3. sync.ts catches the decryption and throws its own access-token text: cannot be decrypted with the current key.
4. error_stored_token_unreadable (en, de) reworded the same way.
5. ENCRYPTION_KEY description in env.ts (and its copies in docs/handbook/docker.md, database.md) without 'today', naming stored source tokens and form secrets.
6. Handbook admin.md sync error table: row for the unreadable token with its causes and fix.
<!-- SECTION:PLAN:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
token-encryption(.spec).ts renamed to secret-encryption(.spec).ts with encryptSecret/decryptSecret; every importer and docs/ARCHITECTURE.md updated. decryptSecret throws 'cannot be decrypted with the current key', naming no secret; sync.ts wraps it (storedToken) and reports 'the stored access token cannot be decrypted with the current key: enter it again on the source page'. error_stored_token_unreadable (en, de) no longer claims ENCRYPTION_KEY changed. ENCRYPTION_KEY description in env.ts names source tokens and form secrets without 'today'; the copies in docs/handbook/docker.md and database.md dropped 'today' too. docs/handbook/admin.md sync error table has a row for the unreadable token with its causes (other key, damaged value) and the fix. make test --changed: 11 files, 192 tests pass.
<!-- SECTION:FINAL_SUMMARY:END -->
