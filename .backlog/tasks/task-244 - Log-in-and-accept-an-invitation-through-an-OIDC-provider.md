---
id: TASK-244
title: Log in and accept an invitation through an OIDC provider
status: To Do
assignee:
  - '@claude'
created_date: '2026-11-05 17:04'
labels:
  - admin
dependencies:
  - TASK-243
priority: high
type: feature
ordinal: 306000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Rebuilt from the SSO milestone in ../grimoire-before-reset (see TODO-UEBERNAHME.md there, point 3), which was reverted with the reset of main; the old code is a reference, not a template. Rights stay as they are: SSO decides only who logs in.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 The login page offers a button per configured provider; the flow uses the authorization code with PKCE, state and nonce, and keeps nothing of the provider tokens
- [ ] #2 A linked identity logs its user in; required claims are checked on every login
- [ ] #3 Without a link, an account is created only for a verified address in an allowed domain of that provider; an address that has an account is refused with a hint how to link
- [ ] #4 An invitation can be accepted through a provider, which links the identity to the new account
- [ ] #5 An account created through a provider has no role and no password
- [ ] #6 A provider that is down or misconfigured gives a message and a log line instead of an error page; failed callbacks are limited per client
<!-- AC:END -->
