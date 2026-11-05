---
id: TASK-254
title: Account layout with sub navigation and first-login landing
status: To Do
assignee: []
created_date: '2026-11-05 20:46'
labels:
  - admin
milestone: m-3
dependencies:
  - TASK-252
documentation:
  - docs/redesign/ux-konzept.md
priority: medium
type: feature
ordinal: 316000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Users without a role have three tasks (create a key, connect an agent, keep their account) on three pages with nothing tying them together; after accepting an invitation they land on the start page without a hint (findings U7, W2). Owner decision O5: on the first login (invitation accepted, account created through single sign-on) the user lands on the API keys with a welcome, afterwards on the start page; `?next=` always wins.

Measure M7 in the concept. Work on the branch `redesign`; it ships in one merge at the end of the milestone.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 The account area has a sub navigation with "API-Keys" and "Anmeldung", the same for admins and users
- [ ] #2 After accepting an invitation and after the sign-on that creates the account, the user lands on the API keys page with a welcome and the hint to create a first key
- [ ] #3 Every later login of a user without a role lands on the start page; a `next` target takes precedence
- [ ] #4 Specs cover all three cases
<!-- AC:END -->
