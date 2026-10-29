---
id: TASK-25
title: Encrypt source access tokens at rest
status: Done
assignee:
  - '@claude'
created_date: '2026-10-28T20:23:00Z'
updated_date: '2026-10-29T00:34:00Z'
labels: []
milestone: m-0
dependencies:
  - TASK-2
  - TASK-26
documentation:
  - docs/concept.md
priority: high
type: feature
ordinal: 25000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Every source stores the read token of its Git provider in `sources.token` (`app/src/lib/server/db/schema.ts`). Git needs the token in clear text, so it cannot be hashed like API keys. Stored in plain text, anyone who gets hold of the SQLite file or a backup of the volume can read every connected repository. The concept requires that tokens never leave grimoire; the database file is the one place where that is not yet true.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Tokens are stored encrypted with authenticated encryption; the database file alone does not reveal them
- [x] #2 The key comes from an environment variable that is required when the server starts
- [x] #3 A wrong or missing key gives a clear error that names the variable and never prints the key or a token
- [x] #4 Unit tests cover the round trip, a wrong key and a tampered value
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. `app/src/lib/server/token-encryption.ts`: `encryptToken(token, key)` / `decryptToken(stored, key)` with AES-256-GCM from `node:crypto`, random 12-byte IV, stored as base64 of IV + auth tag + ciphertext. A wrong key or a changed value throws an error that names `TOKEN_ENCRYPTION_KEY` and contains neither key nor token.
2. `TOKEN_ENCRYPTION_KEY` in `app/src/env.ts`: 32 bytes, base64; required at start, not at build; the validation message never echoes the value.
3. Migration `0002-encrypt-source-tokens.sql`: rename `sources.token` to `encrypted_token` and clear it – SQL cannot encrypt, and no installation holds clear tokens yet.
4. `make dev` gets a fixed development key; handbook documents the variable and how to generate a key.
5. Unit tests: round trip, different ciphertext for the same token, wrong key, tampered value, malformed value, key validation.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
AC "The sync decrypts the token only to run git; the clear value is never stored, logged or returned by the API" moved to TASK-7: there is no sync yet to verify it against (same cut as TASK-6).
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Source access tokens are encrypted with AES-256-GCM (`node:crypto`): `encryptToken` / `decryptToken` in `app/src/lib/server/token-encryption.ts`, random IV per value, stored as base64 of IV + tag + ciphertext. A wrong key or a changed value throws an error naming `TOKEN_ENCRYPTION_KEY` without key or token. `TOKEN_ENCRYPTION_KEY` (32 bytes, base64) is declared in `app/src/env.ts`, required at start including `MIGRATE_ONLY`, not at build; invalid values are rejected without being echoed. Migration `0002-encrypt-source-tokens.sql` renames `sources.token` to `encrypted_token` and clears it. `make dev` uses a fixed development key; `docs/handbook/database.md` documents the variable, key generation and keeping key and backups apart. Verified: 9 tests in `token-encryption.spec.ts`, an upgrade test for `0002` in `migrate.spec.ts` (80 tests in total), `make lint`, `make build`; the built server refuses to start without a key and with a malformed one (value not in the output) and migrates to version 2 with a valid one.
<!-- SECTION:FINAL_SUMMARY:END -->
