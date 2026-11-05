---
id: TASK-257
title: Group the source form into sections with explanations
status: To Do
assignee: []
created_date: '2026-11-05 20:46'
labels:
  - admin
milestone: m-3
dependencies:
  - TASK-256
documentation:
  - docs/redesign/ux-konzept.md
priority: medium
type: enhancement
ordinal: 319000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The source form lists 13 fields one under the other; access (URL, branch, username, token) is not grouped, username and token have no explanation of when they are needed and which rights the token needs (finding U24, chapter 10.4).

Measure M10 in the concept. Work on the branch `redesign`; it ships in one merge at the end of the milestone.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 The form for a new source and the settings of a source show the sections Allgemein, Repository, Zugang, Zeitplan und Sichtbarkeit
- [ ] #2 Username and token explain when they are needed and which rights the token needs
- [ ] #3 "Test connection" sits with repository and access
- [ ] #4 A `FormSection` component has stories with axe
<!-- AC:END -->
