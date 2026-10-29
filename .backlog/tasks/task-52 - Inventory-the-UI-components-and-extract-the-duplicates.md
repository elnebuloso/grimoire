---
id: TASK-52
title: Inventory the UI components and extract the duplicates
status: To Do
assignee: []
created_date: '2026-10-29T06:55:00Z'
labels:
  - admin
dependencies:
  - TASK-51
references:
  - app/src/routes
  - app/src/lib/components
priority: medium
type: task
ordinal: 114000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Most markup still lives in the routes under `app/src/routes`, so the same building blocks (form fields with their error message, status lists, tables, confirm buttons) are likely written several times. Nobody knows which ones exist, which makes it impossible to tell a developer to reuse one. An inventory names them; extracting the duplicates gives the component catalog from TASK-51 its content and gives the coming design system one place per building block to apply to.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 An inventory lists every UI building block found in `app/src/routes`, with the routes that use it and whether it repeats
- [ ] #2 Every building block that repeats is a shared component in `app/src/lib/components` with stories, and all routes that used it use the component
- [ ] #3 Building blocks used only once stay in their route and are marked so in the inventory
- [ ] #4 The pages render and behave as before: `make test` and `make e2e` pass without changing what they assert
- [ ] #5 The inventory is kept where the developer guide from TASK-51 lives
<!-- AC:END -->
