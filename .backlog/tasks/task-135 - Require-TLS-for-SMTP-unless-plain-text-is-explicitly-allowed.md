---
id: TASK-135
title: Require TLS for SMTP unless plain text is explicitly allowed
status: To Do
assignee: []
created_date: '2026-10-30 10:55'
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
- [ ] #1 On ports other than 465, sending fails when the server does not offer STARTTLS, unless plain text is explicitly allowed
- [ ] #2 There is an explicit way to allow plain-text SMTP (for example an environment variable declared in `app/src/env.ts`), and the local mail catcher setup uses it
- [ ] #3 `docs/handbook/docker.md` states that TLS is required, why, and how to allow plain text
- [ ] #4 A test checks the transport options with and without the opt-out
<!-- AC:END -->
