---
id: TASK-289
title: 'Login, account and setup: four small fixes'
status: To Do
assignee: []
created_date: '2026-11-06 15:59'
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
- [ ] #1 `/setup` with an existing address answers `account-exists`
- [ ] #2 A misconfigured provider (including `invalid_client`) shows a message that asks the user to tell an admin
- [ ] #3 The account page clears `?problem=` once shown
- [ ] #4 The export file name uses `slugify`
<!-- AC:END -->
