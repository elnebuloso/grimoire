---
id: TASK-114
title: Reset a forgotten password by mail when SMTP is configured
status: To Do
assignee:
  - '@claude'
created_date: '2026-10-30 08:18'
labels:
  - admin
milestone: m-0
dependencies:
  - TASK-112
  - TASK-113
references:
  - app/src/lib/server/admin/auth.ts
  - app/src/routes/login
priority: medium
type: feature
ordinal: 176000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Context: the Better Auth spike (TASK-111, 2026-10-30) recommended keeping the own auth code in `app/src/lib/server/admin/auth.ts` and adding email login and password reset by mail to it; the user agreed. Agreed rules: no self-registration (the setup creates the first admin, admins create further users later); users log in with their email address instead of a username; whether an address is verified does not matter for now (known risk: a mistyped address sends a reset link to whoever owns it); password reset by mail exists only when SMTP is configured, without SMTP it is not offered; `scripts/reset-admin.ts` (`make admin-reset`) stays as the way back in, with or without SMTP. The app has never been released or installed: no data migration for existing users is needed, but the schema changes as a new numbered migration (ADR 0001: released migrations are never edited).

With email login (TASK-112) and mail sending (TASK-113) in place, a user who forgot the password can set a new one through a link sent to their address, so `make admin-reset` is needed only without SMTP. Behaviour observed in Better Auth during the spike, worth matching: an unknown address gets the same answer as a known one, a token works once and expires (Better Auth: 1 hour), the link carries the token. Login lockout today: 10 failures per client within 15 minutes block that client (`recordFailedLogin` in `auth.ts`).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 With SMTP configured the login page offers "forgot password"; without SMTP neither the link nor the routes exist (404)
- [ ] #2 Requesting a reset answers the same for known and unknown addresses and sends a mail with a link only for a known one
- [ ] #3 The link's token is random, stored only as a hash, works once and expires after a fixed time; an expired or used token gets a message, not an error page
- [ ] #4 Setting the new password checks the same rules as the setup (minimum 12 characters), stores it with `hashPassword`, ends every session of that user and invalidates the user's other reset tokens
- [ ] #5 Reset requests are limited per client and per address, so the form cannot be used to flood a mailbox
- [ ] #6 Every text is a message in each `app/messages/<locale>.json`, including the mail
- [ ] #7 Unit tests cover the token rules; an e2e test requests a reset, reads the mail from the mail catcher, sets a new password and logs in with it
- [ ] #8 `make lint`, `make test` and `make e2e` pass; the handbook describes the reset
<!-- AC:END -->
