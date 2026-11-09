---
id: TASK-114
title: Reset a forgotten password by mail when SMTP is configured
status: Done
assignee:
  - '@claude'
created_date: '2026-10-30 08:18'
updated_date: '2026-10-30 08:47'
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
- [x] #1 With SMTP configured the login page offers "forgot password"; without SMTP neither the link nor the routes exist (404)
- [x] #2 Requesting a reset answers the same for known and unknown addresses and sends a mail with a link only for a known one
- [x] #3 The link's token is random, stored only as a hash, works once and expires after a fixed time; an expired or used token gets a message, not an error page
- [x] #4 Setting the new password checks the same rules as the setup (minimum 12 characters), stores it with `hashPassword`, ends every session of that user and invalidates the user's other reset tokens
- [x] #5 Reset requests are limited per client and per address, so the form cannot be used to flood a mailbox
- [x] #6 Every text is a message in each `app/messages/<locale>.json`, including the mail
- [x] #7 Unit tests cover the token rules; an e2e test requests a reset, reads the mail from the mail catcher, sets a new password and logs in with it
- [x] #8 `make lint`, `make test` and `make e2e` pass; the handbook describes the reset
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Migration 0018 `password_resets` (token hash, user, expiry); `app/src/lib/server/admin/password-reset.ts`: `requestPasswordReset` (limits per client and address, in memory), `resetLinkValid`, `resetPassword` (takes the link inside the transaction, sets the hash, ends sessions, voids other links).
2. `BASE_URL` (required with `SMTP_HOST`) for the link, never the request origin: the Host header is the sender's choice (reset poisoning). `Mailer.link(path)`.
3. Routes `/login/forgot` and `/login/reset/[token]`, 404 without mailer; link on `/login`; `accessRedirect` serves everything under `/login` without a session.
4. Messages en/de incl. the mail; unit tests for tokens and limits, route tests with and without SMTP, e2e reading the mail from Mailpit; handbook.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Additions beyond the task text, both needed for the link to be safe: `BASE_URL` (env, `app/.env.example`, `docs/handbook/docker.md`); `createMailer` refuses `SMTP_HOST` without it, because the request origin comes from the Host header and a reset link to an attacker's host would hand over the token.
Limits: 5 requests per client and 3 links per address within 60 minutes; over the address limit the answer stays the same and nothing is sent. Link valid 60 minutes, single use. Mail sending is not awaited so a known address does not answer slower.
The reset page sends `Referrer-Policy: same-origin`. `no-referrer` was tried first and broke the form: Chromium then posts with `Origin: null`, which SvelteKit's CSRF check refuses (the e2e test failed with it and passed with `same-origin`).
`resetAdmin` also deletes the user's `password_resets` rows (the script runs without foreign keys).
The single-use test catches a missing re-check inside the transaction (checked by removing it).
Verified: make lint, make test (589), make e2e (18: request on /login/forgot, mail read from Mailpit, new password set through the link, link void afterwards, old password refused, new one logs in), make handbook; agent environment without SMTP: no link on /login, /login/forgot and /login/reset/abc answer 404.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
A forgotten password can be reset by mail when SMTP is configured: `/login/forgot` sends a single-use link valid for one hour, `/login/reset/[token]` sets the new password, ends the user's sessions and voids their other links. Known and unknown addresses get the same answer; requests are limited per client (5/h) and per address (3/h). Links point to the new required `BASE_URL`, not to the request's host. Without SMTP the link and pages do not exist (404). Covered by unit, route and e2e tests (the e2e test reads the mail from Mailpit); handbook updated.
<!-- SECTION:FINAL_SUMMARY:END -->
