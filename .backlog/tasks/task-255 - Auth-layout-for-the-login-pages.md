---
id: TASK-255
title: Auth layout for the login pages
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
type: enhancement
ordinal: 317000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Login, password reset, invitation, setup and the sign-on callback are pass-through pages with a single task; they do not belong to any area and need no area switch (chapter 5.2 and 8 of the concept).

Measure M8 in the concept. Work on the branch `redesign`; it ships in one merge at the end of the milestone.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 `/login`, `/login/forgot`, `/login/reset/[token]`, `/invite/[token]`, `/setup` and `/auth/oidc/[key]/callback` use one `AuthLayout`
- [ ] #2 The setup page presents "start new" and "import an export" as two clearly separated ways with one sentence each on when to choose it
- [ ] #3 `AuthLayout` has stories with axe
<!-- AC:END -->
