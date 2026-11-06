---
id: TASK-264
title: Error pages and invalid links with a fitting way out
status: Done
assignee:
  - '@claude'
created_date: '2026-11-05 20:46'
updated_date: '2026-11-06 12:08'
labels:
  - admin
milestone: m-3
dependencies:
  - TASK-255
documentation:
  - docs/redesign/ux-konzept.md
priority: low
type: enhancement
ordinal: 326000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
403 and 404 only offer "To the start page"; an invalid invitation link still shows the lead of the valid case; the login page does not say how to get an account (finding U23).

Measure M17 in the concept. Work on the branch `redesign`; it ships in one merge at the end of the milestone.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 A user on a forbidden page is offered the way back to their account
- [x] #2 An expired invitation or reset link offers the login and the hint to ask an admin for a new link, without the lead of the valid case
- [x] #3 The login page says that accounts come from an invitation or a sign-on provider
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
Rules (shown to the owner 2026-11-06, go):
1. 403 logged in: "To your account" first, then "To the start page"; the text says the page is for admins.
2. 404 and unexpected errors unchanged.
3. Invalid invitation: no lead; the message and a "Log in" link.
4. Invalid reset link with mail: message, "Request a new link", "Log in".
5. Invalid reset link without mail: message asks an admin for a new link, "Log in", no request link.
6. Login: "There is no sign-up: an admin invites you." plus, with providers, that some create the account on the first login.
7. Specs for reset route and error page; login sentence in an e2e step.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Built as planned. The 403 page reads the user from the layout data, available because the access hook lets the page's load throw. The reset page loads resetByMail like the login page. resolve() writes relative links on csr = false pages, so e2e follows the Log in link instead of comparing its href. Not looked at in the browser by hand: covered by e2e steps on the 403 page, the invalid invitation and the login sentence.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
A user turned away from a management page gets "To your account" and the hint that the page is for admins. An invalid invitation shows only the message and a Log in link; an invalid reset link offers Log in and, with mail, Request a new link, without mail the hint to ask an admin. The login page says there is no sign-up, and with providers that some create the account on first login. make lint, make test (1067), make e2e (28) pass.
<!-- SECTION:FINAL_SUMMARY:END -->
