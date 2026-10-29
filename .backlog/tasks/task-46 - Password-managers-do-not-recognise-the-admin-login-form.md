---
id: TASK-46
title: Password managers do not recognise the admin login form
status: To Do
assignee: []
created_date: '2026-10-29T01:08:00Z'
labels:
  - admin
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
- [ ] #1 Bitwarden offers to fill username and password on `/admin/login` (checked by hand in the browser extension)
- [ ] #2 Bitwarden offers to save the new credentials after `/admin/setup` and to update the stored password after `/admin/password`
- [ ] #3 A regression test fails without the fix: it checks the attributes the cause depends on (e.g. `autocomplete` tokens) on the login, setup and password forms
<!-- AC:END -->
