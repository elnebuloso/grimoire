---
id: TASK-111
title: >-
  Spike: Better Auth via sv add-on for accounts with email and password reset by
  SMTP
status: Done
assignee:
  - '@claude'
created_date: '2026-10-30 08:08'
updated_date: '2026-10-30 08:16'
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
- [x] #1 What `npx sv@<pinned version> add better-auth` generates (files, dependencies, hooks, database setup) is listed, tried in a throwaway SvelteKit project outside `app/`
- [x] #2 It is shown whether Better Auth runs on `node:sqlite` without Drizzle in that setup, and whether its schema can be shipped as numbered SQL migrations as ADR 0001 requires
- [x] #3 It is shown how roles as rows in `user_roles` (ADR 0003), the setup token for the first admin, disabled sign-up, the 10-failures lockout, minimum length 12 and 12-hour sessions map onto Better Auth
- [x] #4 Password reset by mail is tried end to end against a local mail catcher, and it is shown that without SMTP the reset is not offered
- [x] #5 The implementation notes end with a recommendation (adopt Better Auth, or add email and reset to the own auth code) and the follow-up tasks either way, for the user to decide
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Throwaway project in the scratchpad: npx sv@1.1.1 create (minimal, ts), then sv add better-auth with every option set; list what it generates.
2. Try Better Auth on node:sqlite without Drizzle; check what the CLI generate/migrate produce and whether it can become numbered SQL.
3. Map roles (user_roles), setup token, disableSignUp, lockout, min length 12, 12-hour sessions onto Better Auth config/plugins/hooks.
4. Reset by mail end to end against Mailpit (docker) and without SMTP.
5. Recommendation and follow-up tasks in the notes.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Tried 2026-10-30 in a throwaway project (`npx sv@1.1.1 create --template minimal --types ts`), outside `app/`, with Node 24.22.1.

## What `sv add better-auth` generates
`npx sv@1.1.1 add drizzle="database:sqlite+sqlite:node-sqlite" better-auth="demo:password" --install npm` (better-auth needs the drizzle add-on). It adds:
- dependencies `better-auth` and `auth` (`^1.6.24`, resolved to 1.7.14 of 2026-10-26, too new for the two-week rule; 1.6.24 is of 2026-07-22), `drizzle-orm`, `drizzle-kit`, `@types/node`
- `src/lib/server/auth.ts` (`betterAuth` with `drizzleAdapter`, `emailAndPassword: { enabled: true }`, `sveltekitCookies` plugin), `src/hooks.server.ts` (`getSession` into `locals.user`/`locals.session`, `svelteKitHandler` serving `/api/auth/*`), `src/env.ts` (`DATABASE_URL`, `ORIGIN`, `BETTER_AUTH_SECRET`), `src/lib/server/db/{index,schema,auth.schema}.ts`, `drizzle.config.ts`, demo routes under `src/routes/demo/` with form actions calling `auth.api.signInEmail`/`signUpEmail`
- scripts `db:push`, `db:generate`, `db:migrate`, `db:studio`, `auth:schema` (drizzle-kit is the migration tool)

## node:sqlite without Drizzle, migrations
Works: `database: new DatabaseSync(...)` directly. `npx auth generate --output schema.sql` writes plain SQL (`create table` statements for `user`, `session`, `account`, `verification` plus indexes), which fits a numbered migration file as ADR 0001 requires. With `user: { modelName: 'users' }` and `advanced.database.generateId: 'serial'` the tables use our name and integer ids (the API still returns ids as strings, e.g. `"1"`). Columns are camelCase. Without the add-on, Better Auth would be installed by hand, which `.claude/rules/svelte-kit.md` forbids for add-ons; with the add-on, Drizzle and drizzle-kit come along, against ADR 0001.

## Mapping our rules
- Roles: a separate `user_roles` table with `REFERENCES users (id)` works next to Better Auth's tables (tried with foreign keys on). ADR 0003 can stay; roles are read after `getSession`.
- Sign-up off: `emailAndPassword.disableSignUp: true` rejects `signUpEmail` with "Email and password sign up is not enabled". The setup and admins create users through `(await auth.$context).internalAdapter.createUser` + `linkAccount` with `ctx.password.hash`, an internal API, not documented as stable. The setup token stays own code.
- Lockout: Better Auth's rate limiter counts every request (default 3 per 10 s on `/sign-in`), is on by default only in production, keeps its counts in memory, and runs only in the HTTP router for `/api/auth/*`: form actions that call `auth.api.*` directly, as the generated demo does, are not limited at all (from the source in `better-auth/dist/api/index.mjs` and `api/rate-limiter/index.mjs`). The lockout after 10 failures per client for 15 minutes stays own code.
- Minimum length 12: `minPasswordLength: 12`, a short password gets `PASSWORD_TOO_SHORT` (tried).
- 12-hour sessions: `session.expiresIn: 12 * 60 * 60` gives sessions of 12 hours (tried); set `disableSessionRefresh` to keep them from sliding.
- Messages: errors come as codes (`body.code`, e.g. `INVALID_EMAIL_OR_PASSWORD`), which the routes can translate with `m.*`.
- Hash: Better Auth hashes with Node's async `scrypt` at N=2^14, r=16, p=1, stored as `salt:hash` hex without parameters, compared with `===`. That is below the OWASP minimum TASK-110 just raised us to; keeping our level means plugging our `hashPassword`/`passwordMatches` into `password: { hash, verify }`. An unknown email is hashed as well, so it takes as long as a known one.
- `scripts/reset-admin.ts` keeps working through the same internal adapter or plain SQL.

## Reset by mail
Tried end to end against Mailpit (`axllent/mailpit:v1.27`) with `nodemailer` 10.1.1: `POST /api/auth/request-password-reset` calls `sendResetPassword`, the mail arrives, its link redirects to `redirectTo?token=…`, `POST /api/auth/reset-password` sets the new password, login works with it, the token cannot be used twice, an unknown email gets the same answer. Without `sendResetPassword` (no SMTP) the endpoint answers "Reset password isn't enabled", so the function simply is not there. Sessions are not ended on reset unless `revokeSessionsOnPasswordReset` is set.

## Recommendation
Stay with the own auth code for now and add email login and the reset by mail to it. Better Auth would take over sessions, the reset token and change-password, but for grimoire's rules the setup token, the lockout, the roles, the hash level and the message translation all stay own code, and adopting it costs either Drizzle (against ADR 0001) or an exception to the add-on rule, plus reliance on its internal adapter for creating users. What it saves is small; the reset flow itself is one token table and two routes. Better Auth pays off once users come from an external identity provider (OIDC/SSO, the revision condition of ADR 0003); reconsider it then.

## Follow-up tasks (not created, for the user to decide)
Either way:
1. Users log in by email instead of username (`users.email` unique, setup, user creation, login form, messages).
2. Optional SMTP settings (env), sending through `nodemailer`; Mailpit in `make dev` and `make e2e`.
3. "Forgot password" by mail, offered only with SMTP: token table, request and reset routes, sessions of the user ended on reset, e2e test reading the mail from Mailpit.
If Better Auth instead: an ADR replacing the relevant parts of 0001 (and stating the add-on rule exception or Drizzle), then 1-3 on Better Auth.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Spike done in a throwaway project. Better Auth runs on node:sqlite without Drizzle and its schema comes out as plain SQL, but the sv add-on brings Drizzle; the setup token, lockout (its rate limiter does not cover form actions), roles, hash level and translations stay own code either way. Reset by mail works end to end against Mailpit, and is absent without SMTP. Recommendation: keep the own auth code, add email login and reset by mail; reconsider Better Auth when SSO/OIDC is needed. Three follow-up tasks are listed in the notes, not created.
<!-- SECTION:FINAL_SUMMARY:END -->
