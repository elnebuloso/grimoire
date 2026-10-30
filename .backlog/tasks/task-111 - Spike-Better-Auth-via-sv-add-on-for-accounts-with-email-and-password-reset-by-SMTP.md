---
id: TASK-111
title: >-
  Spike: Better Auth via sv add-on for accounts with email and password reset by
  SMTP
status: To Do
assignee:
  - '@claude'
created_date: '2026-10-30 08:08'
updated_date: '2026-10-30 08:10'
labels:
  - admin
milestone: m-0
dependencies: []
references:
  - app/src/lib/server/admin/auth.ts
  - docs/decisions/0001-sqlite-single-instance-with-forward-migrations.md
  - docs/decisions/0003-users-with-roles.md
  - scripts/reset-admin.ts
priority: medium
type: spike
ordinal: 173000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Accounts, sessions, password hashing and login lockout are hand-written in `app/src/lib/server/admin/auth.ts` (about 350 lines); the scrypt cost had to be tuned by hand. The idea is to replace this with Better Auth (https://svelte.dev/docs/cli/better-auth, added through `npx sv@<version> add better-auth` as `.claude/rules/svelte-kit.md` requires) and to give every user an email address, so a forgotten password is reset by a mail link.

Direction agreed with the user (2026-10-30):
- No self-registration. Users are created by the setup (first admin) and later by admins.
- Users log in with their email address instead of a username; the username goes. Email is unique per user.
- Whether an address is verified does not matter for now; no verification mail. Known risk, to be named in the result: a mistyped address sends the reset link to whoever owns it.
- Password reset by email exists only when SMTP is configured; without SMTP the function is not offered.
- `scripts/reset-admin.ts` (reset from inside the container) stays as the way back in, with or without SMTP: common practice for self-hosted apps, and whoever has a shell in the container has the data anyway.
- In `make dev` and `make e2e` a mail catcher (e.g. Mailpit) receives the mails when SMTP is configured.
- The app has never been released or installed: nothing has to be migrated, the current auth code may be thrown away.

Known from the docs (read 2026-10-30, not tried): the add-on sets up Better Auth with Drizzle as database adapter and email/password login, its only option is `demo` (`password`, `github`). Better Auth itself supports `node:sqlite` `DatabaseSync` directly, creates its tables through its own CLI (`npx auth migrate` / `generate`), hashes with scrypt by default, has `emailAndPassword.disableSignUp`, and sends reset mails through a `sendResetPassword` callback the app implements.

Possible conflicts with existing decisions: ADR 0001 (plain SQL through `node:sqlite`, all SQL in the database module, numbered forward-only migrations) against Drizzle and Better Auth's own migrations; ADR 0003 (roles as one row per user and role in `user_roles`, setup reachable while no admin exists) against Better Auth's role handling. Features to keep or map: setup token logged on first start, lockout after 10 failed logins per client for 15 minutes, minimum password length 12, sessions ending after 12 hours, translated error messages (`app/messages/*.json`). API keys for MCP stay own code.

Do the spike in a throwaway project outside `app/`; `app/` stays unchanged. The result is a recommendation for the user, who decides; an ADR follows only after that decision.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 What `npx sv@<pinned version> add better-auth` generates (files, dependencies, hooks, database setup) is listed, tried in a throwaway SvelteKit project outside `app/`
- [ ] #2 It is shown whether Better Auth runs on `node:sqlite` without Drizzle in that setup, and whether its schema can be shipped as numbered SQL migrations as ADR 0001 requires
- [ ] #3 It is shown how roles as rows in `user_roles` (ADR 0003), the setup token for the first admin, disabled sign-up, the 10-failures lockout, minimum length 12 and 12-hour sessions map onto Better Auth
- [ ] #4 Password reset by mail is tried end to end against a local mail catcher, and it is shown that without SMTP the reset is not offered
- [ ] #5 The implementation notes end with a recommendation (adopt Better Auth, or add email and reset to the own auth code) and the follow-up tasks either way, for the user to decide
<!-- AC:END -->
