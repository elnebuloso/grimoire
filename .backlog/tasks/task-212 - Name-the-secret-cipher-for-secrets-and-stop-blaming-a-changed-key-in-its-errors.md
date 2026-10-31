---
id: TASK-212
title: >-
  Name the secret cipher for secrets and stop blaming a changed key in its
  errors
status: To Do
assignee: []
created_date: '2026-10-31 13:06'
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
- [ ] #1 The cipher module and its functions are named for secrets (e.g. `encryptSecret`/`decryptSecret`), and every caller is updated
- [ ] #2 The error the cipher throws names no particular secret; each caller says which secret failed
- [ ] #3 The sync error and `error_stored_token_unreadable` (every locale) say the stored token cannot be decrypted with the current key, without claiming that `ENCRYPTION_KEY` changed
- [ ] #4 The `ENCRYPTION_KEY` description in `app/src/env.ts` covers stored source tokens and form secrets, and does not say "today"
- [ ] #5 The handbook names the possible causes of an unreadable stored token wherever it explains that error
<!-- AC:END -->
