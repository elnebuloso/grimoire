---
id: TASK-113
title: 'Optional SMTP settings for sending mail, with a mail catcher in dev and e2e'
status: Done
assignee:
  - '@claude'
created_date: '2026-10-30 08:18'
updated_date: '2026-10-30 08:34'
labels:
  - admin
milestone: m-0
dependencies: []
references:
  - app/src/env.ts
  - Makefile
  - docs/handbook/docker.md
priority: medium
type: feature
ordinal: 175000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Context: the Better Auth spike (TASK-111, 2026-10-30) recommended keeping the own auth code in `app/src/lib/server/admin/auth.ts` and adding email login and password reset by mail to it; the user agreed. Agreed rules: no self-registration (the setup creates the first admin, admins create further users later); users log in with their email address instead of a username; whether an address is verified does not matter for now (known risk: a mistyped address sends a reset link to whoever owns it); password reset by mail exists only when SMTP is configured, without SMTP it is not offered; `scripts/reset-admin.ts` (`make admin-reset`) stays as the way back in, with or without SMTP. The app has never been released or installed: no data migration for existing users is needed, but the schema changes as a new numbered migration (ADR 0001: released migrations are never edited).

The reset by mail needs a way to send mail, and nothing in grimoire sends mail yet. The spike tried `nodemailer` (10.1.1, the latest version older than two weeks on 2026-10-30) against Mailpit (`axllent/mailpit:v1.27`, SMTP on 1025, web UI and API on 8025, `GET /api/v1/messages`, `GET /api/v1/message/<ID>`): it delivers, but the first mail took a few seconds to arrive, so tests reading mail have to poll. Variables are declared in `app/src/env.ts` with `defineEnvVars` (see `.claude/rules/memory.md`); new dependencies are pinned exactly and at least two weeks old. `make e2e` runs against the production build with a fresh database and does not use Docker today; how the mail catcher starts for `make dev`, `make e2e` and the agent environment (`make agent-start`) is open.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 SMTP is configured through optional variables in `app/src/env.ts` (at least host, port, user, password, sender address); with none set, the app starts and runs as today
- [x] #2 A server module sends a mail when SMTP is configured and reports that mail is unavailable otherwise; a failed send is logged without the password and does not crash the request
- [x] #3 `make dev` and `make e2e` can run with a mail catcher that receives the mails, with a documented way to start it
- [x] #4 The handbook documents the SMTP variables (`docs/handbook/docker.md` or the page that lists the other variables); `make handbook` builds
- [x] #5 Tests cover the configured and the unconfigured case; `make lint` and `make test` pass
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. `nodemailer` 10.1.1 (2026-10-14) and `@types/nodemailer` 8.0.2 (latest; no types for 10 yet), pinned.
2. `app/src/lib/server/mail/smtp.ts` (no env import, like `sync/schedule.ts`): `parseSmtpPort`, `createMailer(settings)` -> undefined without host, throws without sender, `send` returns false and logs on failure. `mail/index.ts`: `mailer()` built once from `/env/private`; `init` calls it so incomplete settings stop the start.
3. `SMTP_HOST`, `SMTP_PORT` (default 587, 465 = TLS), `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_FROM` in `app/src/env.ts`, `app/.env.example`, `docs/handbook/docker.md`.
4. Mailpit `axllent/mailpit:v1.31.6` (2026-10-15): `make mail-catcher` for `make dev` (1025/8025); `make e2e` starts its own as a second Playwright web server (4125/4825) and passes the SMTP variables to the server.
5. Unit tests with a mocked transport; live check against Mailpit.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Playwright ends web servers with SIGKILL unless `gracefulShutdown` is set; killed that way, `docker run` left the Mailpit container running. With `gracefulShutdown: { signal: 'SIGTERM' }` the container is gone after the run, and the command removes a leftover one first. With two web servers Playwright no longer derives `baseURL` from the port, so it is set in `use`.
`make e2e` needs Docker now (CI's ubuntu runner has it).
The agent environment (`scripts/agent-env.sh`) has no SMTP settings yet; TASK-114 may add them when it needs to try the reset by hand.
Verified: unit tests for configured, unconfigured, port 465, failed send (logged without the password), port parsing; a temporary test sent through `createMailer` to `make mail-catcher` and the mail showed in Mailpit's API, an unreachable server returned false and was logged; the built server refuses to start with `SMTP_HOST` but no `SMTP_FROM` and starts as before without SMTP; make lint, make test (571), make e2e (17, container removed afterwards), make handbook.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
grimoire can send mail through an SMTP server set by `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD` and `SMTP_FROM`; without `SMTP_HOST` it runs as before and `mailer()` returns undefined, with a host but no sender it does not start. Sending goes through `nodemailer`; failures are logged and reported as false. `make mail-catcher` runs Mailpit for `make dev`; `make e2e` starts its own Mailpit and points the server at it. Documented in `app/.env.example`, `docs/handbook/docker.md` and the README.
<!-- SECTION:FINAL_SUMMARY:END -->
