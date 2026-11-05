---
id: TASK-263
title: 'Start page: simple status, documentation links, search and readable answers'
status: To Do
assignee: []
created_date: '2026-11-05 20:46'
labels:
  - admin
milestone: m-3
dependencies:
  - TASK-258
documentation:
  - docs/redesign/ux-konzept.md
priority: medium
type: enhancement
ordinal: 325000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The start page shows every visitor sync error words, "paused" and dead links they cannot act on; no source is linked; the answer of "Try a query" is a raw Markdown block of about 2600 px (findings U14, U15, U16). Owner decisions: O3 show only the state of the content to everyone, O4 no content view but a link to the source's documentation site, O6 hundreds of sources.

Measure M16 in the concept. Work on the branch `redesign`; it ships in one merge at the end of the milestone.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 The start page shows per source only "Stand: <date of the last successful sync>" or "Noch nicht verfügbar", for every role; sources without a successful sync stay in the list
- [ ] #2 A source with a documentation site links to it for everyone; for admins every source links to its management view
- [ ] #3 The source catalogue can be searched by name, slug and description
- [ ] #4 The query answer shows hits as sections with source and path, the raw text can be expanded; no hits show a sentence
<!-- AC:END -->
