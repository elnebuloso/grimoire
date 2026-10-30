---
id: TASK-159
title: Reject invalid JSON in JSON columns
status: To Do
assignee: []
created_date: '2026-10-30 15:32'
labels: []
milestone: m-0
dependencies: []
priority: medium
type: chore
ordinal: 221000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Several TEXT columns hold JSON (`sources.exclusions`, `sources.warnings`, `pages.tags`, `snippets.aliases`, `snippets.title_path`). Nothing in the schema checks it, so a broken value surfaces only as a parse error when the row is read, far from where it was written.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Each JSON column has `CHECK (json_valid(...))`
- [ ] #2 A test shows that writing invalid JSON to one of them is refused
<!-- AC:END -->
