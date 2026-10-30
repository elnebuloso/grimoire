---
id: TASK-175
title: Drop the 1.0 schema-update section from the database handbook page
status: To Do
assignee: []
created_date: '2026-10-30 16:13'
labels: []
milestone: m-0
dependencies: []
priority: low
type: docs
ordinal: 237000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The section "Schema updates" in `docs/handbook/database.md` begins "From `1.0.0` on" and describes behaviour no released version has. For a reader of a 0.x release that is a roadmap promise, which `.claude/rules/writing-the-handbook.md` keeps out of user docs, and the section above it already says 0.x has no update path.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 `docs/handbook/database.md` describes only behaviour of the current 0.x releases
- [ ] #2 `make handbook` passes
<!-- AC:END -->
