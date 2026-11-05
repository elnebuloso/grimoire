---
id: TASK-244
title: Log in and accept an invitation through an OIDC provider
status: Done
assignee:
  - '@claude'
created_date: '2026-11-05 17:04'
updated_date: '2026-11-05 17:22'
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
 Rights stay as they are: SSO decides only who logs in.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 The login page offers a button per configured provider; the flow uses the authorization code with PKCE, state and nonce, and keeps nothing of the provider tokens
- [x] #2 A linked identity logs its user in; required claims are checked on every login
- [x] #3 Without a link, an account is created only for a verified address in an allowed domain of that provider; an address that has an account is refused with a hint how to link
- [x] #4 An invitation can be accepted through a provider, which links the identity to the new account
- [x] #5 An account created through a provider has no role and no password
- [x] #6 A provider that is down or misconfigured gives a message and a log line instead of an error page; failed callbacks are limited per client
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
oidc/ (flow, decision, identities, start, cookie) and the routes /auth/oidc/[key] and its callback; createSession, endSessions and accountExists exported from admin/auth.ts; ENCRYPTION_KEY derives oidcFlows. A provider login without role lands on / (homeOf). Login button selector in e2e made exact, since the provider buttons also start with "Log in".
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Login and invitation pages offer a button per provider; the callback logs in a linked identity, creates an account without role and password for a verified address in an allowed domain, accepts an invitation by linking the identity, and refuses everything else with a message. Verified: make lint, make test (984), make e2e (27, including login and invitation through the mock).
<!-- SECTION:FINAL_SUMMARY:END -->
