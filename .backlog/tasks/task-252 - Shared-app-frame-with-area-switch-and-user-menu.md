---
id: TASK-252
title: Shared app frame with area switch and user menu
status: To Do
assignee: []
created_date: '2026-11-05 20:46'
labels:
  - admin
milestone: m-3
dependencies: []
documentation:
  - docs/redesign/ux-konzept.md
priority: high
type: feature
ordinal: 314000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Start page, account and management are loosely coupled: the management navigation links to account pages that do not show it, users without a role reach their pages only through a header button and their email address, and the header takes four lines on a phone (findings U6, U7, U26). Chapter 5.3 of the concept defines one frame for every page except the login pages.

Measure M5 in the concept. Work on the branch `redesign`; it ships in one merge at the end of the milestone.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Every page except the login pages shows the brand, an area switch (Start, Account when logged in, Management for admins) with the current area marked, and a user menu (email, log out) or "Log in"
- [ ] #2 Language and theme are in the user menu, for anonymous visitors in the footer
- [ ] #3 Users without a role see no management entry
- [ ] #4 On a phone the frame takes one line
- [ ] #5 `AppShell`, `AreaSwitch` and `UserMenu` have stories per role, with axe
- [ ] #6 `theme.e2e.ts` and `language.e2e.ts` pass with the moved switches
<!-- AC:END -->
