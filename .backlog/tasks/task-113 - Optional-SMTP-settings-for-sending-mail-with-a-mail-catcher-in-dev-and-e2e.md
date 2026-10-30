---
id: TASK-113
title: 'Optional SMTP settings for sending mail, with a mail catcher in dev and e2e'
status: To Do
assignee:
  - '@claude'
created_date: '2026-10-30 08:18'
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
- [ ] #1 SMTP is configured through optional variables in `app/src/env.ts` (at least host, port, user, password, sender address); with none set, the app starts and runs as today
- [ ] #2 A server module sends a mail when SMTP is configured and reports that mail is unavailable otherwise; a failed send is logged without the password and does not crash the request
- [ ] #3 `make dev` and `make e2e` can run with a mail catcher that receives the mails, with a documented way to start it
- [ ] #4 The handbook documents the SMTP variables (`docs/handbook/docker.md` or the page that lists the other variables); `make handbook` builds
- [ ] #5 Tests cover the configured and the unconfigured case; `make lint` and `make test` pass
<!-- AC:END -->
