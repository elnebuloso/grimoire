---
id: TASK-227
title: Invite users by email
status: Done
assignee:
  - '@claude'
created_date: '2026-11-03 00:30'
updated_date: '2026-11-03 01:08'
labels:
  - admin
milestone: m-2
dependencies:
  - TASK-221
references:
  - app/src/lib/server/admin/password-reset.ts
  - app/src/routes/setup/
  - app/src/lib/server/mail/index.ts
priority: high
type: feature
ordinal: 289000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
New users can only come from the setup today, which creates the first admin. Admins are to add more people. A link must work only for the address it was sent to and only once; anyone who holds the mail can use it, so it expires and can be replaced. SMTP is optional on an instance.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 An admin invites an email address; an address that already has an account or a pending invite is refused with a message
- [x] #2 The invite goes out by mail; without SMTP the admin is shown the link once to copy
- [x] #3 The link opens a form with the fields of the setup form, the email address fixed; setting a password creates a user without roles and logs them in
- [x] #4 The link works once and for 7 days; a used, expired, replaced or revoked link is refused with a message
- [x] #5 Only a hash of the token is stored, like password reset links; two submits of the same link create one user
- [x] #6 Tests cover each refusal and the double submit
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Migration 0004: invitations (email unique, token hash, invited_by, sent_at, expires_at).
2. invitations.ts: inviteUser, resendInvitation, revokeInvitation, listInvitations, invitedEmail, acceptInvitation (hash first, take the link inside a transaction, create a user without roles).
3. /invite/[token]: setup-style form with the address fixed, logs in and opens /manage.
4. /manage/users (admin-only): invite form; mail via mailer(), else (or on mail failure) the link shown once via a new ShownOnce component, shared with the API key page; pending invitations with send time.
5. Specs for module and routes; try in agent environment.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Resend and revoke exist in invitations.ts and are tested there; their buttons come with the user management page (TASK-228). The invite link is built from mail.link (BASE_URL) when SMTP is configured, otherwise from the public origin of the request.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Admins invite an address on /manage/users. The link goes out by mail; without SMTP, or when the mail server refuses, the admin sees the link once (new ShownOnce component, also used for new API keys). Invitations (migration 0004) store only the token hash, last 7 days, are refused for existing accounts or a waiting invitation, and are replaced by sending again. /invite/[token] shows the setup fields with the invited address fixed; choosing a password creates a user without roles, uses up the link inside a transaction (a double submit creates one account) and logs in. Tests: invitations.spec (each refusal, expiry, replace, revoke, double submit, hash only), invite.spec (mail, link without SMTP, mail failure, existing account, accept and login, short password, used link), ShownOnce story. Tried in the agent environment: invite, accept, used link refused.
<!-- SECTION:FINAL_SUMMARY:END -->
