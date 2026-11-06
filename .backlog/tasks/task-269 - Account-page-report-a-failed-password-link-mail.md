---
id: TASK-269
title: 'Account page: report a failed password-link mail'
status: Done
assignee:
  - '@claude'
created_date: '2026-11-06 15:55'
updated_date: '2026-11-06 16:26'
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
- [x] #1 When `mail.send` returns `false`, the action answers with `fail(...)` and the page shows that the mail could not be sent, instead of a success toast
- [x] #2 A regression spec with `send` resolving `false` fails before the fix and passes after
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Regression spec with send resolving false (fails first)
2. passwordLink answers fail(502, { linkError }) when send returns false; the page already shows linkError through FormError like the 429 refusal
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
- The issued link still counts against the 3 links per hour of the address; the message points to an admin instead of retrying. Withdrawing the unsent link is out of the criteria.
- Shown through the existing FormError of the form (same path as the 429 refusal, submitWithToast updates form on failure); not tried in the browser because the agent environment's mail catcher never refuses.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
The account page's password link action now fails with a message ('The mail to … could not be sent. Try again later, or ask an admin for a password link.') when the mail is refused, instead of toasting success. Regression spec in password-reset.spec.ts failed before and passes after.
<!-- SECTION:FINAL_SUMMARY:END -->
