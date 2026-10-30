---
id: TASK-88
title: 'Admin: preview a page as the snippets it is split into'
status: To Do
assignee: []
created_date: '2026-10-30 02:00'
updated_date: '2026-10-30 02:02'
labels:
  - admin
  - parsing
milestone: m-0
dependencies: []
references:
  - 'app/src/routes/manage/projects/[id]/sources/[sourceId]/+page.svelte'
documentation:
  - docs/concept.md
priority: medium
type: feature
ordinal: 150000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The concept promises "a preview of the snippets" per source. The source page today shows only the whole page as `read` returns it, so how a page is cut into snippets – and whether a section ends up too large, too small or under a misleading title path – stays invisible. That split is what search ranks and what the token budget packs.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 The page preview on the source page lists the page's snippets in order, each with its ID, title path and estimated tokens
- [ ] #2 Each snippet's content is shown as it is stored in the index
- [ ] #3 A page without snippets says so instead of showing an empty list
- [ ] #4 Tests cover loading the snippets of a page
<!-- AC:END -->
