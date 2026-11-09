---
id: TASK-415
title: >-
  OIDC: remove a pending invitation when its address signs up through an
  identity provider
status: To Do
assignee: []
created_date: '2026-11-09 10:17'
updated_date: '2026-11-09 10:20'
labels:
  - admin
dependencies: []
priority: low
type: bug
ordinal: 477000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
### What this is
An admin can invite an address (`app/src/lib/server/admin/invitations.ts`). Independently, an identity provider may create an account on first login for allowed addresses (`createLinkedUser` in `app/src/lib/server/oidc/identities.ts`, called from the OIDC callback).

### Problem
When an invited person signs up through the provider before accepting the invitation, the invitation stays pending under `/manage/users?tab=invitations`. **Resend** mails a link that looks valid, but opening it ends with "account exists". `inviteUser` already refuses addresses that have an account; this path never cleans up.

### Fix
In the transaction of `createLinkedUser`, also run `DELETE FROM invitations WHERE email = ?` for the new account's address (use the same address normalisation as `inviteUser`). Add a case to `app/src/lib/server/oidc/identities.spec.ts`.

### If we skip it
A dead invitation sits in the list, and resending it confuses the invited person.

### Notes for the implementer
- Commit type: `fix` (released behaviour changes), so pushing it cuts a release; afterwards write the release-notes summary per `.claude/rules/release-notes.md`.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 createLinkedUser deletes invitations for the new account's address in the same transaction
- [ ] #2 identities.spec.ts covers it
<!-- AC:END -->
