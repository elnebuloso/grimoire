---
id: TASK-14
title: Admin login
status: To Do
assignee: []
created_date: '2026-10-28T19:32:00Z'
labels:
  - admin
milestone: m-0
dependencies:
  - TASK-1
documentation:
  - docs/konzept.md
priority: high
type: feature
ordinal: 14000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The admin area manages sources with access tokens and API keys, so it must be protected. Version 1 starts with one local admin account; OAuth comes later.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Admin credentials come from environment variables
- [ ] #2 Login creates a session; logout ends it
- [ ] #3 Every admin page and action rejects requests without a valid session
- [ ] #4 Tests cover login, wrong credentials and access without a session
<!-- AC:END -->
