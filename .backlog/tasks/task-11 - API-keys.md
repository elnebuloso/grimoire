---
id: TASK-11
title: API keys
status: To Do
assignee: []
created_date: '2026-10-28T19:32:00Z'
labels:
  - agent-api
milestone: m-0
dependencies:
  - TASK-2
documentation:
  - docs/konzept.md
priority: high
type: feature
ordinal: 11000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Agents authenticate with API keys. grimoire only reads, so a key needs no roles, only a project scope: all projects or a selection. A leaked database must not leak usable keys.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Only a hash of the key is stored; the plain key exists only at creation
- [ ] #2 A key is scoped to all projects or a selection of projects
- [ ] #3 A project outside the scope behaves exactly like a project that does not exist
- [ ] #4 Requests without a valid key are rejected
<!-- AC:END -->
