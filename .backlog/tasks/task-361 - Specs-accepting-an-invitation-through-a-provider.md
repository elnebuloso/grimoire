---
id: TASK-361
title: 'Specs: accepting an invitation through a provider'
status: Done
assignee:
  - '@claude'
created_date: '2026-11-06 23:47'
updated_date: '2026-11-07 01:05'
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
- [x] #1 Specs in `invitations.spec.ts` cover the four guarantees above
- [x] #2 Each spec fails when the guarantee it covers is removed from the code
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. describe('acceptInvitationWithIdentity') in invitations.spec.ts: invited address kept (lower case), linked identity, no roles, no password; link taken once; identity linked elsewhere refused and the link stays usable; link expired during the provider flow refused
2. Mutation check of the expiry and identity guards
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
- invitations.spec.ts passes (12 tests). With `expires_at > ?` and the linked-identity check removed from acceptInvitationWithIdentity, exactly the expiry and the identity specs fail (checked, code restored).
- The function takes no email from the provider at all; the first spec pins that the account carries the invited address.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Four specs now cover accepting an invitation through an identity provider: the account gets the invited address with no roles and no password and is linked to the identity, a link works once, an identity already linked elsewhere is refused while the link stays usable, and a link that expired during the provider flow is refused. Removing the expiry or identity guard makes its spec fail (checked).
<!-- SECTION:FINAL_SUMMARY:END -->
