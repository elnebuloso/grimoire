---
id: TASK-243
title: >-
  OIDC providers from the environment, accounts without password, linked
  identities
status: Done
assignee:
  - '@claude'
created_date: '2026-11-05 17:04'
updated_date: '2026-11-05 17:11'
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
- [x] #1 Providers come from `OIDC_PROVIDERS` and `OIDC_<KEY>_ISSUER`, `_CLIENT_ID`, `_CLIENT_SECRET`, optional `_LABEL`, `_ALLOWED_DOMAINS`, `_REQUIRED_CLAIMS`; a setting that cannot work fails the start naming its variable; the log names the redirect URI to register
- [x] #2 A new migration allows users without password and adds a table of identities (issuer, subject) with at most one per user and provider
- [x] #3 Export and import carry the identities; the 1.4.0 fixture still imports
- [x] #4 `make dev`, `make e2e` and the agent environment have a mock identity provider
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Ported de54f5c, a0ad0bc, ad18ffe from ../grimoire-before-reset with git apply --reject; migration renumbered to 0007; openid-client pinned to 6.8.8 (6.8.9 is three days old). Mock ports: make idp-mock 8090, agent environment 5580, e2e 4580.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
OIDC providers are read from OIDC_PROVIDERS and OIDC_<KEY>_* and checked at start, which logs the redirect URI per provider. Migration 0007 makes the password optional and adds user_identities; export and import carry it. The account page tells an account without password how to set one. A mock provider runs for make idp-mock, make e2e and the agent environment. Verified: make lint, server specs (884), make e2e (25), agent environment logs both redirect URIs.
<!-- SECTION:FINAL_SUMMARY:END -->
