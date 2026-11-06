---
id: TASK-269
title: 'Account page: report a failed password-link mail'
status: To Do
assignee: []
created_date: '2026-11-06 15:55'
labels:
  - admin
dependencies: []
priority: high
type: bug
ordinal: 331000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The `passwordLink` action in `app/src/routes/account/+page.server.ts` awaits `mail.send(...)` and returns `{ linkSent }` whatever it returns. `send` in `app/src/lib/server/mail/smtp.ts` reports a refused or failed delivery as `false` and only logs it. The link is issued anyway (`admin/password-reset.ts`) and counts against the 3 requests per hour for the address.

A user who signs in through an identity provider and asks for a password gets the toast "link sent to …", waits for a mail that never comes, and after three tries is told they are blocked. The users page handles the same case (`deliver()` in `app/src/routes/manage/users/+page.server.ts` falls back to showing the link). No enumeration concern applies: the user is logged in and asks for their own address.

The only spec of this action (`routes/login/password-reset.spec.ts`) uses a `send` that always resolves `true`; `invite/invite.spec.ts` shows the pattern with `send.mockResolvedValue(false)`.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 When `mail.send` returns `false`, the action answers with `fail(...)` and the page shows that the mail could not be sent, instead of a success toast
- [ ] #2 A regression spec with `send` resolving `false` fails before the fix and passes after
<!-- AC:END -->
