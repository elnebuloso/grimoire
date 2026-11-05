---
id: TASK-266
title: Schedule field with a plain-language reading of the cron expression
status: To Do
assignee: []
created_date: '2026-11-05 20:46'
labels:
  - admin
milestone: m-3
dependencies:
  - TASK-257
documentation:
  - docs/redesign/ux-konzept.md
priority: low
type: enhancement
ordinal: 328000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The schedule of a source is raw cron syntax (finding U24). Optional measure M19 of the concept.

Measure M19 in the concept. Work on the branch `redesign`; it ships in one merge at the end of the milestone.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 The schedule field shows next to the expression what it means in plain language, and the global default
- [ ] #2 An invalid expression is reported at the field as today
- [ ] #3 `ScheduleField` has stories with axe
<!-- AC:END -->
