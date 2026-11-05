---
id: TASK-246
title: 'Handbook: single sign-on'
status: Done
assignee:
  - '@claude'
created_date: '2026-11-05 17:04'
updated_date: '2026-11-05 17:29'
labels:
  - admin
dependencies:
  - TASK-245
priority: medium
type: docs
ordinal: 308000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
 Rights stay as they are: SSO decides only who logs in.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 The operator page names the variables per provider and the redirect URI to register, with GitLab and Microsoft Entra as examples
- [x] #2 The user and admin pages describe logging in, linking, unlinking and accounts without password, with the messages and their fixes
<!-- AC:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
New operator page "Single sign-on" (sso.md, from the old state, adapted: accounts from a provider have no role), OIDC_PROVIDERS in the variable table, login and linking on the user page (renamed "Your account and API keys"), login methods on the admin page, identities in "Moving an instance". make handbook passes (--strict).
<!-- SECTION:FINAL_SUMMARY:END -->
