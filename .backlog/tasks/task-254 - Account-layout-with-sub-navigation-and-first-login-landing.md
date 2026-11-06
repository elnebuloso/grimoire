---
id: TASK-254
title: Account layout with sub navigation and first-login landing
status: Done
assignee:
  - '@claude'
created_date: '2026-11-05 20:46'
updated_date: '2026-11-05 23:45'
labels:
  - admin
milestone: m-3
dependencies:
  - TASK-252
documentation:
  - docs/redesign/ux-konzept.md
priority: medium
type: feature
ordinal: 316000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Users without a role have three tasks (create a key, connect an agent, keep their account) on three pages with nothing tying them together; after accepting an invitation they land on the start page without a hint (findings U7, W2). Owner decision O5: on the first login (invitation accepted, account created through single sign-on) the user lands on the API keys with a welcome, afterwards on the start page; `?next=` always wins.

Measure M7 in the concept. Work on the branch `redesign`; it ships in one merge at the end of the milestone.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 The account area has a sub navigation with "API-Keys" and "Anmeldung", the same for admins and users
- [x] #2 After accepting an invitation and after the sign-on that creates the account, the user lands on the API keys page with a welcome and the hint to create a first key
- [x] #3 Every later login of a user without a role lands on the start page; a `next` target takes precedence
- [x] #4 Specs cover all three cases
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Owner rules R1-R8 (2026-11-06): account layout with two tabs "API keys" (`/account/api-keys`) and "Login and password" (`/account`), same for every user; normal width, the `/account` form stays narrow. First login (invitation accepted by password or SSO, SSO sign-up) lands on `/account/api-keys?welcome` with a notice "Welcome to {instance}. Create your first key to connect an agent." and a link to the new-key form; later logins as today (`/` without a role, `/manage` for admins); `next` always wins. Management nav links stay for TASK-253, key dialogs for TASK-261.
2. `app/src/routes/account/+layout.svelte` with the tabs (`SubNav` only if a second use appears; here one place).
3. Invite action and OIDC callback: redirect to the welcome target for a new account unless `next`.
4. Specs for the invitation, SSO sign-up, later login and `next` on a first login; `users.md`.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Tabs "API keys" and "Login and password" (same label as the user menu entry, owner rule R1) in `app/src/routes/account/+layout.svelte`; styled like the management nav, which TASK-253 replaces, so no shared component yet. `/account` left the narrow column; its sheets keep a 30rem measure. `WELCOME_PAGE` in `access.ts`: the invite action redirects there, the OIDC callback for an accepted invitation or a created account unless the flow carries `next`. The welcome notice shows while `?welcome` is in the address. Specs: `invite.spec.ts` (landing), `callback.spec.ts` ("where a login lands": sign-up, invitation, later login, `next` on a first login). e2e: invitations by password and SSO land on the welcome; the sign-up from `/account` keeps its `next`. Checked by hand in light and dark.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
The account area has two tabs, "API keys" and "Login and password", the same for every user. A new account (invitation accepted by password or provider, or created by a provider login) lands on `/account/api-keys?welcome` with "Welcome to {instance}. Create your first key to connect an agent." and a link to the new-key form; later logins land as before, and a `next` target always wins. Handbook `users.md` describes landing and tabs. Verified: `make lint`, `make test` (1029 tests), `make e2e` (28 passed), `make handbook`, by hand in both schemes.
<!-- SECTION:FINAL_SUMMARY:END -->
