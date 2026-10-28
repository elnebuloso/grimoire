---
id: TASK-17
title: 'Admin: API key management'
status: To Do
assignee: []
created_date: '2026-10-28T19:32:00Z'
labels:
  - admin
milestone: m-0
dependencies:
  - TASK-11
  - TASK-14
documentation:
  - docs/konzept.md
priority: medium
type: feature
ordinal: 17000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Agents need API keys, created and revoked by the admin. Only the hash is stored, so the key can be shown only once.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 A key can be created with a name and a scope (all projects or a selection)
- [ ] #2 The plain key is shown exactly once after creation
- [ ] #3 Keys are listed with name and scope, without the key
- [ ] #4 A key can be revoked and stops working immediately
<!-- AC:END -->
