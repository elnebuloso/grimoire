---
id: TASK-361
title: 'Specs: accepting an invitation through a provider'
status: To Do
assignee: []
created_date: '2026-11-06 23:47'
labels:
  - admin
dependencies: []
references:
  - app/src/lib/server/admin/invitations.ts
priority: low
type: task
ordinal: 423000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
`acceptInvitationWithIdentity` in `app/src/lib/server/admin/invitations.ts` (around lines 143-160) creates the invited account linked to the provider identity and uses up the invitation. Its only test is `app/src/routes/auth/oidc/[key]/callback/callback.spec.ts` (around lines 121-128), which checks the redirect target.

Untested guarantees, so a refactor could break them silently:
- the account gets the invited address, not the provider's `email` claim (this path skips the allowed-domain and `email_verified` checks by design, so taking the claim would let the holder of an invitation link sign up under any address their provider reports);
- the invitation works once;
- an identity already linked to another account is refused with `oidc-identity-taken`;
- an invitation that expires during the 10-minute provider flow is refused (`expires_at > ?` in the `DELETE`).

Found by the third whole-repo audit on 2026-11-07 (HEAD 4a72798).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Specs in `invitations.spec.ts` cover the four guarantees above
- [ ] #2 Each spec fails when the guarantee it covers is removed from the code
<!-- AC:END -->
