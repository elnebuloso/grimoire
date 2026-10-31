---
id: TASK-209
title: Rename TOKEN_ENCRYPTION_KEY to ENCRYPTION_KEY and derive one key per purpose
status: To Do
assignee: []
created_date: '2026-10-31 12:36'
updated_date: '2026-10-31 12:41'
labels:
  - ops
milestone: m-1
dependencies: []
documentation:
  - docs/decisions/0006-one-instance-key-with-a-derived-key-per-purpose.md
priority: high
type: task
ordinal: 271000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Before 1.0.0, rename the environment variable `TOKEN_ENCRYPTION_KEY` to `ENCRYPTION_KEY`: the key of the instance for every secret grimoire stores, today the Git access tokens of all sources. After 1.0.0 a rename breaks every installation; now it costs nothing, since 0.x has no update path.

Why: as settings move into the database, more secrets will be stored there (an SMTP password, the client secret of an external identity provider) and need the same instance key. Not the reason: exports. Agreed with the user that an export of settings and sources gets its own passphrase chosen at export time, so it can move between instances and does not tie them to one shared key; that is decided when the export is built.

Today `app/src/lib/server/token-encryption.ts` uses the key directly for AES-256-GCM. With one key for several purposes, each purpose gets its own key derived with HKDF and a purpose label (`source-tokens` for the Git tokens), so no two purposes share key material. Stored ciphertexts change; fine before 1.0.0.

No other name on top: the other variables carry no prefix (`DATABASE_PATH`, `SYNC_SCHEDULE`), so no `APP_` or `GRIMOIRE_`.

Places that name the variable today (`grep -rn TOKEN_ENCRYPTION_KEY` outside `.backlog/`): `app/src/env.ts`, `app/src/lib/server/token-encryption.ts` and its spec, `app/src/lib/server/sync/` (`sync.ts`, `index.ts`, specs), `app/src/lib/server/admin/source-access.ts`, `app/src/routes/manage/sources/`, `app/src/lib/server/db/migrations/0001-initial.sql` (comment), `app/messages/*.json`, `app/.env.example`, `app/playwright.config.ts`, `scripts/setup.sh`, `scripts/agent-env.sh`, `scripts/image-smoke.sh`, `README.md`, `docs/handbook/docker.md`, `docs/handbook/database.md`.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 No file outside `.backlog/` names `TOKEN_ENCRYPTION_KEY`; the server reads `ENCRYPTION_KEY` and does not start without it, also with `MIGRATE_ONLY`
- [ ] #2 Git tokens are encrypted with a key derived from `ENCRYPTION_KEY` by HKDF with a purpose label; a test shows a token encrypted for one purpose label cannot be decrypted with another
- [ ] #3 A token stored under one key still fails to decrypt under another key, and entering a new token afterwards still works (the TASK-203 regression test passes)
- [ ] #4 `docs/handbook/docker.md`, `docs/handbook/database.md`, `app/.env.example` and `README.md` describe `ENCRYPTION_KEY` as the key for the secrets grimoire stores, today the Git access tokens
- [ ] #5 `make setup`, `make agent-reset` and `make image-smoke` work with the new name
- [ ] #6 `make lint`, `make test`, `make e2e` and `make handbook` pass
- [ ] #7 The developer's `app/.env` (not committed) carries the existing key value under `ENCRYPTION_KEY` instead of `TOKEN_ENCRYPTION_KEY`, changed in the same step as the code, so `make dev` keeps starting; its database then needs the Git tokens entered again or `app/data/` deleted, since the derived key changes the ciphertexts
- [ ] #8 `docs/ARCHITECTURE.md`, next to the paragraph on secrets, describes the procedure for maintainers: one `ENCRYPTION_KEY`, one key per purpose derived from it with HKDF-SHA256 and a fixed purpose label, nothing derived is stored, a new purpose gets a new label and never reuses one, and why (no two purposes share key material, so a value encrypted for one is never valid for another)
- [ ] #9 The handbook tells operators only what they act on: one key protects every secret grimoire stores, and with another key every stored secret is unreadable until it is entered again — no word on HKDF (the handbook rule keeps build internals out)
<!-- AC:END -->
