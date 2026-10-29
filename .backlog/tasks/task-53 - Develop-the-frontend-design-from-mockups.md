---
id: TASK-53
title: Develop the frontend design from mockups
status: To Do
assignee: []
created_date: '2026-10-29T06:55:00Z'
updated_date: '2026-10-29T06:58:00Z'
labels:
  - admin
milestone: m-0
dependencies: []
references:
  - .claude/rules/until-v1.md
priority: medium
type: task
ordinal: 115000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The frontend has no visual design yet: until one is agreed, it is built with browser defaults only (`.claude/rules/until-v1.md`, section "Frontend: function first"). A design described in words or shown as static pictures is hard to judge, so the developer chooses among working mockups instead, in as many rounds as it takes, and the chosen one becomes the template that TASK-37 implements.

The mockups are separate from `app/`: they imitate the current behaviour but do not change the product, so the function-first rule for the frontend stays in force until TASK-37.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Each round offers the developer a proposed number of independent mockups, each in a clearly different direction or, after the first round, a different variation of the chosen one
- [ ] #2 Every mockup opens in the browser and is fully usable: every page of the current UI (start page, login, setup, admin dashboard, projects, project wizard, sources, API keys, password) with its states, including empty, error and validation states
- [ ] #3 The mockups mirror the current behaviour of the UI: the same pages, fields, steps and messages, without inventing features
- [ ] #4 After each round the developer picks a direction, and the choice and feedback are recorded before the next round starts
- [ ] #5 The rounds end when the developer declares the design agreed
- [ ] #6 The agreed design is usable as a template for implementation: the final mockup plus its design decisions (colours, typography, spacing, components, light and dark variant) are kept in the repository
<!-- AC:END -->
