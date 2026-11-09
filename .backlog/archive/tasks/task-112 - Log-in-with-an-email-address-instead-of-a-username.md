---
id: TASK-112
title: Log in with an email address instead of a username
status: Done
assignee:
  - '@claude'
created_date: '2026-10-30 08:18'
updated_date: '2026-10-30 08:26'
labels:
  - admin
milestone: m-0
dependencies: []
references:
  - app/src/lib/server/admin/auth.ts
  - app/src/lib/server/db/migrations/0010-users.sql
  - scripts/agent-seed.ts
  - scripts/reset-admin.ts
  - docs/handbook/admin.md
priority: medium
type: feature
ordinal: 174000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Context: the Better Auth spike (TASK-111, 2026-10-30) recommended keeping the own auth code in `app/src/lib/server/admin/auth.ts` and adding email login and password reset by mail to it; the user agreed. Agreed rules: no self-registration (the setup creates the first admin, admins create further users later); users log in with their email address instead of a username; whether an address is verified does not matter for now (known risk: a mistyped address sends a reset link to whoever owns it); password reset by mail exists only when SMTP is configured, without SMTP it is not offered; `scripts/reset-admin.ts` (`make admin-reset`) stays as the way back in, with or without SMTP. The app has never been released or installed: no data migration for existing users is needed, but the schema changes as a new numbered migration (ADR 0001: released migrations are never edited).

A reset link needs an address to go to, and with the address in place a separate username is a second identifier nobody needs. Today `users.username` (`TEXT NOT NULL UNIQUE`, `app/src/lib/server/db/migrations/0010-users.sql`) is what the setup (`app/src/routes/setup/`), the login (`app/src/routes/login/`), the account page (`app/src/routes/account/`), `createUser`/`setupAdmin`/`login` in `auth.ts`, `scripts/reset-admin.ts` (confirms the admin username), `scripts/agent-seed.ts` (fixture login `agent`) and the handbook (`docs/handbook/admin.md`, `docs/handbook/docker.md`) use.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 `users` holds an email address instead of a username, unique regardless of letter case, through a new numbered migration
- [x] #2 The setup asks for an email address instead of a username and rejects one that is not an address, with a message in every `app/messages/<locale>.json`
- [x] #3 Login takes the email address; an unknown address and a wrong password get the same answer and take about as long, as today
- [x] #4 Header, account page and every other place that showed the username show the email address
- [x] #5 `scripts/reset-admin.ts` asks for the admin's email address; `make admin-reset` works as before
- [x] #6 The agent fixture logs in by email; `.claude/rules/agent-environment.md` names the new login
- [x] #7 Handbook pages that mention the username are updated; `make handbook` builds
- [x] #8 `make lint`, `make test` and `make e2e` pass
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Migration 0017 renames users.username to email; auth.ts stores and looks up addresses trimmed and lowercased, so the existing UNIQUE constraint holds regardless of case.
2. setupAdmin rejects what does not look like an address (code 'email-invalid'); messages in en/de.
3. Setup, login, account (type=email, autocomplete=username), header, reset-admin, agent seed, agent rules, handbook, Makefile help.
4. Specs, e2e, agent environment.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Uniqueness regardless of letter case is done by normalizing in `auth.ts` (`normalizeEmail`: trim + toLowerCase) rather than a NOCASE index: SQLite's NOCASE folds only ASCII, toLowerCase also the rest. Rows written by other SQL than `createUser` (only `scripts/agent-seed.ts`, which writes lowercase) must stay lowercase.
The address check is deliberately loose (`x@y.z` without spaces); only sending can prove an address.
Existing developer databases keep their username as email value after the migration (e.g. `admin`); it still logs in with that string, or is replaced through `make admin-reset` and the setup.
Verified: make lint, make test (565), make e2e (17), make handbook; agent environment: `agent@example.com` and ` Agent@Example.COM` log in (303 to /manage), `agent` gets "Wrong email address or password.", the login field is `type=email autocomplete=username`.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Users log in with their email address instead of a username. Migration 0017 renames the column; addresses are stored and compared trimmed and lowercased, so they are unique regardless of case. The setup rejects what is not an address; login, account page, header, `scripts/reset-admin.ts`, the agent fixture (`agent@example.com`), `.claude/rules/agent-environment.md` and the handbook follow. Tests: 565 unit, 17 e2e.
<!-- SECTION:FINAL_SUMMARY:END -->
