---
id: TASK-264
title: Error pages and invalid links with a fitting way out
status: To Do
assignee: []
created_date: '2026-11-05 20:46'
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
- [ ] #1 A user on a forbidden page is offered the way back to their account
- [ ] #2 An expired invitation or reset link offers the login and the hint to ask an admin for a new link, without the lead of the valid case
- [ ] #3 The login page says that accounts come from an invitation or a sign-on provider
<!-- AC:END -->
