---
id: TASK-98
title: Filter the page list of a source
status: To Do
assignee: []
created_date: '2026-10-30 02:01'
updated_date: '2026-10-30 02:02'
labels:
  - admin
milestone: m-0
dependencies: []
references:
  - 'app/src/routes/manage/projects/[id]/sources/[sourceId]/+page.svelte'
priority: low
type: enhancement
ordinal: 160000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The source page lists every page in one `<ul>`. For a documentation set with hundreds of pages finding one to preview means scrolling or using the browser search.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Above the page list there is a filter field that narrows the list by file path and title
- [ ] #2 Without JavaScript the full list is shown
- [ ] #3 A filter that matches nothing says so
- [ ] #4 A test checks filtering by typing as a user would
<!-- AC:END -->
