---
id: TASK-46
title: Password managers do not recognise the admin login form
status: Done
assignee:
  - '@claude'
created_date: '2026-10-29T01:08:00Z'
updated_date: '2026-10-31 00:17'
labels:
  - admin
milestone: m-1
dependencies: []
references:
  - app/src/routes/admin/login/+page.svelte
  - app/src/routes/admin/setup/+page.svelte
  - app/src/routes/admin/password/+page.svelte
priority: medium
type: bug
ordinal: 108000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Bitwarden offers nothing to fill on `/admin/login`: neither username nor password is recognised, so the admin types the credentials by hand. The credentials are often a long generated password that only exists in the manager.

Cause not yet confirmed (guess from reading the forms): the username fields on `/admin/login` and `/admin/setup` carry no `autocomplete="username"`, so the manager cannot pair a username with the password field. `/admin/password` has no username field at all, so a changed password cannot be saved to the right entry. Confirm the cause before fixing it. Other things to check: the page being served over plain `http`, and the form being replaced on hydration.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Bitwarden offers to fill username and password on `/admin/login` (checked by hand in the browser extension)
- [x] #2 Bitwarden offers to save the new credentials after `/admin/setup` and to update the stored password after `/admin/password`
- [x] #3 A regression test fails without the fix: it checks the attributes the cause depends on (e.g. `autocomplete` tokens) on the login, setup and password forms
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Add `autocomplete="username"` to the username fields on `/admin/login` and `/admin/setup`
2. Add a read-only username field with `autocomplete="username"` to `/admin/password`
3. Assert the tokens in `admin.e2e.ts`; confirm the test fails without the fix
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Cause from reading the forms, not confirmed in Bitwarden (no Bitwarden available to the agent): the login page is server-rendered with `csr = false`, so hydration is ruled out; the username inputs had no `autocomplete` token, and `/admin/password` had no username field.

Fixed in `fix(admin): let password managers recognise the admin login`. `make lint`, `make test` and `make e2e` pass; with the Svelte changes stashed, `make e2e` fails on the new `toHaveAttribute` assertion in the setup test.

Open: AC #1 and #2 need a manual check in the Bitwarden browser extension by the user. If Bitwarden still offers nothing, check next whether the instance runs over plain `http` and whether a vault item with a matching URI exists.

User confirmed by hand in the Bitwarden browser extension that fill and save are offered.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Username fields on `/admin/login` and `/admin/setup` now carry `autocomplete="username"`; `/admin/password` gained a read-only username field so a changed password lands in the right vault entry. The e2e test asserts the tokens and fails without the fix; the user confirmed the behaviour in Bitwarden.
<!-- SECTION:FINAL_SUMMARY:END -->
