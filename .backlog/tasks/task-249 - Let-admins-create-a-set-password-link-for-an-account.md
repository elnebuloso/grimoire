---
id: TASK-249
title: Let admins create a set-password link for an account
status: Done
assignee:
  - '@claude'
created_date: '2026-11-05 20:46'
updated_date: '2026-11-05 22:44'
labels:
  - admin
milestone: m-3
dependencies: []
documentation:
  - docs/redesign/ux-konzept.md
priority: high
type: feature
ordinal: 311000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
An account created through single sign-on has no password. Without a password it can neither link a second provider nor unlink its only one. Without a mail server there is no way to get a password: the account page sends the user to an admin, who has no function for it, and inviting the address again is refused because the account exists. With a mail server, the account page links to `/login/forgot`, which redirects logged-in users away. Owner decision O1 in the concept: the admin creates a set-password link, mailed when a mail server is configured, otherwise shown once, like an invitation link.

Measure M2 in the concept. Work on the branch `redesign`; it ships in one merge at the end of the milestone.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 On the users page an admin can create a set-password link for an account; with a mail server it is mailed, without one it is shown once with a copy button
- [x] #2 The link lets the account holder set a password; it expires and works once, like the reset link
- [x] #3 The account page offers a working way to a password for an account without one: with a mail server a link to the own address, without one the hint to ask an admin, who can now act
- [x] #4 No link on the account page leads to a page that redirects logged-in users away
- [x] #5 Specs cover both cases (with and without mail server); the e2e flow covers creating and using the link
- [x] #6 The handbook page for users and the admin page describe the new function
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Rules as agreed with the owner on 2026-11-05: action on every account but the own, level 1 confirmation, mailed with a mail server and shown once without, valid 24 hours and once, a new link voids earlier ones, logged with who created it for whom.
`createPasswordLink` in `app/src/lib/server/admin/password-reset.ts` shares the token handling with `requestPasswordReset` (`issueLink`). `/login/reset/[token]` no longer needs a mail server and is served with or without a session (`access.ts`); `/login/forgot` stays mail-only and still sends logged-in users on. The users page action `passwordLink` reuses the invitation delivery, now `deliver(to, path, url, mailText)`. The account page sends the own address a link through `requestPasswordReset` (1 hour, 3 per hour per address) instead of linking to `/login/forgot`; the message key `password_none_reset_link` is gone.
Checked by hand in the agent environment: SSO sign-up without a password, "Send me a link", the mail, the link opened while logged in, password set, sessions ended, login with it; admin link for another account with dialog, mail and toast; no action on the own row; the log line. The shown-once case without a mail server is covered by `users.spec.ts`, not tried by hand (the agent environment has a mail catcher).
Specs: `password-reset.spec.ts` (24 hours, voids earlier links, current password until used, unknown account), `auth.spec.ts` (reset page with a session), `login/password-reset.spec.ts` (page without SMTP, admin link, own link with its limit), `users.spec.ts`. e2e: the partner without any way to log in gets a link from the admin and logs in with the new password. Handbook: users.md "Setting a first password", admin.md "Password link", sso.md.
make lint, make test (1010), make e2e (28), make handbook pass.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
An account without a password is no longer stuck. Admins create a link to set the password of any other account on the users page: mailed with a mail server, shown once without, working once within 24 hours, earlier links void, each creation logged. Accounts without a password send themselves a link from the account page when mail is set up, otherwise they are told to ask an admin. The page that sets the password now works without a mail server and for logged-in visitors; "Forgot your password?" stays mail-only. Specs, an e2e flow and the handbook pages for users, admins and single sign-on cover it.
<!-- SECTION:FINAL_SUMMARY:END -->
