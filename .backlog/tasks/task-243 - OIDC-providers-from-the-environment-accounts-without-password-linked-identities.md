---
id: TASK-243
title: >-
  OIDC providers from the environment, accounts without password, linked
  identities
status: To Do
assignee:
  - '@claude'
created_date: '2026-11-05 17:04'
labels:
  - admin
dependencies:
  - TASK-242
priority: high
type: feature
ordinal: 305000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Foundation for SSO. Rebuilt from the SSO milestone in ../grimoire-before-reset (see TODO-UEBERNAHME.md there, point 3), which was reverted with the reset of main; the old code is a reference, not a template. Rights stay as they are: SSO decides only who logs in.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Providers come from `OIDC_PROVIDERS` and `OIDC_<KEY>_ISSUER`, `_CLIENT_ID`, `_CLIENT_SECRET`, optional `_LABEL`, `_ALLOWED_DOMAINS`, `_REQUIRED_CLAIMS`; a setting that cannot work fails the start naming its variable; the log names the redirect URI to register
- [ ] #2 A new migration allows users without password and adds a table of identities (issuer, subject) with at most one per user and provider
- [ ] #3 Export and import carry the identities; the 1.4.0 fixture still imports
- [ ] #4 `make dev`, `make e2e` and the agent environment have a mock identity provider
<!-- AC:END -->
