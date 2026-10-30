---
id: TASK-37
title: Finalize the frontend design
status: To Do
assignee: []
created_date: '2026-10-28T23:50:00Z'
updated_date: '2026-10-30 18:28'
labels:
  - admin
milestone: m-0
dependencies:
  - TASK-53
documentation:
  - docs/design.md
priority: low
type: feature
ordinal: 99000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Until the user agrees on a visual design, the frontend is built for structure and function only, with browser defaults and no own styling (`.claude/rules/until-v1.md`, section "Frontend: function first"). This task gives the admin area its visual design and ends that phase. It comes last, after all functional work of version 1.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 The admin area has a visual design the user agreed on
- [ ] #2 Every admin flow covered by `make e2e` still works with the design
- [ ] #3 The "Frontend: function first" section is removed from `.claude/rules/until-v1.md`
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Accepted only by the user explicitly confirming the design; not marked done before that
<!-- DOD:END -->
