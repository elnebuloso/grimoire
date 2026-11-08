---
id: TASK-406
title: 'API keys: guard key creation against a borrowed session'
status: To Do
assignee: []
created_date: '2026-11-08 19:51'
labels:
  - admin
  - agent-api
dependencies: []
priority: medium
type: enhancement
ordinal: 468000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Found by the audit of 2026-11-08 (three independent reviewers, the severe findings re-checked by reading). Creating an API key at `/account/api-keys` (`create` action in `app/src/routes/account/api-keys/+page.server.ts`, around lines 62-82) needs only the session. A password change or reset (`setPasswordHash` in `app/src/lib/server/auth/auth.ts`) ends sessions and reset links but keeps keys. Case: a colleague uses a session left open for a minute, creates a key for all sources without expiry; the owner later changes their password, every session ends, and the key keeps reading every source the owner can read. Linking a provider and the instance export ask for the current password against exactly this case; key creation does not. The key does show in the owner's list. Product decision for the owner before building: ask for the current password when creating a key (where the account has one, as link and export do; OIDC-only accounts follow the existing rule), or tell the user after a password change or reset that their keys still work, with a link to `/account/api-keys`.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 The owner's decision is recorded in the task before implementation
- [ ] #2 The chosen guard works for a password account and has a defined behaviour for an OIDC-only account, covered by specs
- [ ] #3 `docs/handbook/users.md` says what the user must do; new texts exist in every `app/messages/<locale>.json` and follow `.claude/rules/glossary-de.md`
<!-- AC:END -->
