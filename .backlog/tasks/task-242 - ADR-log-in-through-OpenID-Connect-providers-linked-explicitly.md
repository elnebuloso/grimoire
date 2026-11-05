---
id: TASK-242
title: 'ADR: log in through OpenID Connect providers, linked explicitly'
status: Done
assignee:
  - '@claude'
created_date: '2026-11-05 17:04'
updated_date: '2026-11-05 17:04'
labels:
  - admin
dependencies: []
priority: high
type: docs
ordinal: 304000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Users want to log in with the account their organisation already manages. Rights stay as they are: SSO decides only who logs in. Agreed in chat: accounts from a provider get no role.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 ADR 0011 records providers as configuration, identities by issuer and subject, linking only by the logged-in owner, account creation through an invitation or a verified address in an allowed domain, required claims, no stored tokens, local roles, accounts without password and unlinking that leaves a way in
<!-- AC:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
ADR 0011 (Proposed); accounts from a provider get no role.
<!-- SECTION:FINAL_SUMMARY:END -->
