---
id: TASK-135
title: Require TLS for SMTP unless plain text is explicitly allowed
status: Done
assignee:
  - '@claude'
created_date: '2026-10-30 10:55'
updated_date: '2026-10-30 11:10'
labels:
  - admin
milestone: m-0
dependencies: []
priority: medium
type: bug
ordinal: 197000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Found in the second whole-project code review of 2026-10-30. `createMailer` in `app/src/lib/server/mail/smtp.ts` (around lines 55-61) sets `secure` only for port 465; on other ports nodemailer upgrades with STARTTLS only when the server offers it, and `requireTLS` is not set. An attacker between grimoire and the mail server can strip the `STARTTLS` offer, and the connection continues in plain text: `AUTH` sends `SMTP_PASSWORD` readable, and every password reset mail carries a token that sets the admin password. `docs/handbook/docker.md` (around line 137) describes the fallback as a feature without this consequence. The local mail catcher (`make mail-catcher`, Mailpit on port 1025) speaks no TLS and must keep working.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 On ports other than 465, sending fails when the server does not offer STARTTLS, unless plain text is explicitly allowed
- [x] #2 There is an explicit way to allow plain-text SMTP (for example an environment variable declared in `app/src/env.ts`), and the local mail catcher setup uses it
- [x] #3 `docs/handbook/docker.md` states that TLS is required, why, and how to allow plain text
- [x] #4 A test checks the transport options with and without the opt-out
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. createMailer sets requireTLS unless SmtpSettings.allowPlainText; new env var SMTP_ALLOW_PLAINTEXT (true/else) declared in env.ts and passed in mail/index.ts.
2. Verified with a fake SMTP server without STARTTLS that nodemailer 10.1.1 sends AUTH in plain text without requireTLS and refuses before AUTH with it.
3. e2e config, .env.example (mail catcher) and docker.md use/describe the opt-out; unit tests for both transport settings.
<!-- SECTION:PLAN:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
On ports other than 465 the SMTP transport now sets requireTLS, so a server without STARTTLS (or a stripped offer) gets no mail instead of the password and reset links in plain text. SMTP_ALLOW_PLAINTEXT=true allows plain text; the e2e config sets it, .env.example tells make dev users with the mail catcher to set it, and docker.md explains both. Measured against a fake SMTP server with nodemailer 10.1.1: without requireTLS it received AUTH in plain text, with it the send failed with "Error upgrading connection with STARTTLS" before AUTH. Unit tests check both transport settings; make lint, make handbook and make e2e (18 tests, including the reset mail) pass. Note: a developer app/.env that points at the mail catcher needs SMTP_ALLOW_PLAINTEXT=true.
<!-- SECTION:FINAL_SUMMARY:END -->
