---
id: TASK-289
title: 'Login, account and setup: four small fixes'
status: Done
assignee:
  - '@claude'
created_date: '2026-11-06 15:59'
updated_date: '2026-11-06 16:54'
labels:
  - admin
dependencies: []
priority: low
type: bug
ordinal: 351000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Four small errors around accounts:
- `/setup` after a reopen (no admin left, only possible by a direct database edit): `setupAdmin` (`app/src/lib/server/admin/auth.ts`) inserts without checking whether the address exists, so an existing address ends in a UNIQUE-constraint 500 instead of the `account-exists` refusal.
- A misconfigured provider tells the user to try again later: `ProviderMisconfigured` extends `ProviderUnavailable` (`app/src/lib/server/oidc/flow.ts`), so start and callback answer `oidc-unavailable`; an `invalid_client` at the token step becomes `oidc-failed` ("Start it again"). Only the operator can fix it, and the user gets no hint to tell an admin.
- `?problem=` on the account page is never cleared (`app/src/routes/account/+page.server.ts`), unlike `?linked=` (`+page.svelte`). After a failed link its message stays through every later action, a successful unlink included.
- The export file name builds its own slug (`app/src/routes/manage/settings/export/+server.ts`) instead of `slugify` from `lib/slug.ts`, which `connect.ts` uses: „Prüfung“ becomes `pr-fung` in the file name and `pruefung` in the MCP name.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 `/setup` with an existing address answers `account-exists`
- [x] #2 A misconfigured provider (including `invalid_client`) shows a message that asks the user to tell an admin
- [x] #3 The account page clears `?problem=` once shown
- [x] #4 The export file name uses `slugify`
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. setupAdmin refuses an existing address with account-exists, inside its transaction
2. New problem oidc-misconfigured: ProviderMisconfigured at start and callback, and a configuration OAuth error (invalid_client) at the token step; message asks to tell an admin
3. Account page keeps a refusal from ?problem= in page state, removes it from the address, and drops it at the next action
4. Export file name through slugify
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
- redirectToProvider now takes the page to return to and picks the problem itself (unavailable or misconfigured).
- New start.spec.ts covers the start endpoint's two refusals; callback.spec expects oidc-misconfigured for invalid_client; auth.spec covers setup with an existing address.
- Checked by hand: /account?problem=oidc-misconfigured shows the message, the address becomes /account, the next form action removes it.
- Handbook sso.md: new section for the misconfigured message, with the discovery and invalid_client log lines moved there.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Four account fixes: /setup after a reopen refuses an existing address with account-exists instead of a 500; a misconfigured provider (bad issuer, invalid_client) now says to tell an admin instead of 'try again later'/'start it again'; the account page shows a ?problem= once and drops it from the address and at the next action; the export file name uses slugify. Specs for each server part, the account page checked in the browser, handbook updated.
<!-- SECTION:FINAL_SUMMARY:END -->
