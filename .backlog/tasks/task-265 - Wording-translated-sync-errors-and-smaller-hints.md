---
id: TASK-265
title: 'Wording, translated sync errors and smaller hints'
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
priority: low
type: enhancement
ordinal: 327000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
German texts mix terms ("User" next to "Quellen", "gesynct" next to "synct"), sync errors stay English, dead links offer no way to the file, the pages for missed queries, pausing and export lack a sentence each that prevents a wrong assumption (findings U10, U17, U18, U25, U27, U28). Owner decision O9: the try-a-query search does not count as missed.

Measure M18 in the concept. Work on the branch `redesign`; it ships in one merge at the end of the milestone.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 A glossary of the German terms is written down and `app/messages/de.json` follows it; it is settled before the page tasks add texts
- [ ] #2 Sync errors appear translated
- [ ] #3 Each dead link links to its file in the repository where the source knows an edit URL, and to the page preview
- [ ] #4 The missed-queries page says that only agent searches count
- [ ] #5 The global pause says that sources can also be paused one by one
- [ ] #6 The export says that importing happens on the setup page of a new, empty instance
<!-- AC:END -->
