---
id: TASK-280
title: One function for setting a password
status: Done
assignee:
  - '@claude'
created_date: '2026-11-06 15:57'
updated_date: '2026-11-06 16:44'
labels:
  - admin
dependencies: []
priority: medium
type: task
ordinal: 342000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Three functions each write `password_hash`, end the sessions and delete the reset links by hand: `changePassword` (`app/src/lib/server/admin/auth.ts`), `resetPassword` (`admin/password-reset.ts`, with its own `DELETE FROM sessions` instead of `endSessions`) and `grantAdmin` (`auth.ts`, used by `scripts/grant-admin.ts` through plain Node). The identity side follows another rule: `unlinkIdentity` and `removeIdentity` (`oidc/identities.ts`) end sessions but keep pending reset links; `linkIdentity` ends nothing. In the same spirit, `inviteUser` checks for an existing account with its own `SELECT 1 FROM users` (`admin/invitations.ts`) while `acceptInvitation` next to it calls `accountExists`.

The next rule about what a credential change invalidates (a mail to the owner, an audit line) has to be found and repeated in three files, one of them run outside Vite. A missed copy is a session that survives a reset.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 One function in `auth.ts` sets a password, ends sessions (optionally keeping the current one) and deletes reset links; `changePassword`, `resetPassword` and `grantAdmin` call it
- [x] #2 It stays loadable by plain Node for `scripts/grant-admin.ts`
- [x] #3 Whether linking or unlinking an identity voids reset links is decided and implemented once
- [x] #4 `inviteUser` uses `accountExists`
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. setPasswordHash in auth.ts (hash, sessions except one, reset links), inside the caller's transaction; changePassword, resetPassword and grantAdmin call it
2. Identity rule (owner): link, unlink and admin remove end the user's other sessions, keep the current one, keep reset links; linkIdentity and removeIdentity take keepSession
3. inviteUser uses accountExists
4. Texts: account lead, handbook admin and users pages
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
- Owner decision: identity changes end other sessions, keep the current session, keep reset links. Settles question 2 of TASK-297 (an admin removing their own link stays logged in).
- auth.ts still loads in plain Node (checked with node -e import).
- Linking now ends the user's other sessions too (before: nothing); account lead and handbook say so.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
One function, setPasswordHash in auth.ts, now sets a password, ends sessions (optionally keeping one) and voids reset links; changePassword, resetPassword and grantAdmin use it. Identity changes follow one rule: link, unlink and an admin's remove end the user's other sessions, keep the current one and keep reset links, so an admin removing their own link is no longer logged out. inviteUser uses accountExists. Specs for the identity rule; auth, identity, account and route specs green; auth.ts loads in plain Node.
<!-- SECTION:FINAL_SUMMARY:END -->
