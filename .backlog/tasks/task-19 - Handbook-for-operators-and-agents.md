---
id: TASK-19
title: Handbook for operators and agents
status: To Do
assignee: []
created_date: '2026-10-28T19:32:00Z'
updated_date: '2026-10-29T00:34:00Z'
labels: []
milestone: m-0
dependencies:
  - TASK-18
documentation:
  - docs/concept.md
priority: medium
type: docs
ordinal: 19000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Operators need to know how to run grimoire, and doc authors how to write docs that split into useful snippets. The handbook in `docs/handbook/` is published on its own one day.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 A page explains running the Docker image and every environment variable
- [ ] #2 A page explains connecting agents via MCP and via the `CLAUDE.md` snippet with `/instructions`
- [ ] #3 A page explains the writing rules: one topic per file, every section understandable on its own
- [ ] #4 Pages are in English and link only within the handbook
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Handoff from TASK-26: the handbook starts with `docs/handbook/database.md` (database configuration, schema updates, backups); link it from the operator pages.

`docs/handbook/database.md` also holds the sync schedule section by now; decide whether it becomes its own operator page.
<!-- SECTION:NOTES:END -->
