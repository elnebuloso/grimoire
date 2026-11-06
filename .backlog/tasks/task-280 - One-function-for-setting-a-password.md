---
id: TASK-280
title: One function for setting a password
status: To Do
assignee: []
created_date: '2026-11-06 15:57'
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
- [ ] #1 One function in `auth.ts` sets a password, ends sessions (optionally keeping the current one) and deletes reset links; `changePassword`, `resetPassword` and `grantAdmin` call it
- [ ] #2 It stays loadable by plain Node for `scripts/grant-admin.ts`
- [ ] #3 Whether linking or unlinking an identity voids reset links is decided and implemented once
- [ ] #4 `inviteUser` uses `accountExists`
<!-- AC:END -->
