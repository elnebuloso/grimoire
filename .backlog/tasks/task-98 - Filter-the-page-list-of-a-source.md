---
id: TASK-98
title: Filter the page list of a source
status: Done
assignee:
  - '@claude'
created_date: '2026-10-30 02:01'
updated_date: '2026-10-30 02:46'
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
- [x] #1 Above the page list there is a filter field that narrows the list by file path and title
- [x] #2 Without JavaScript the full list is shown
- [x] #3 A filter that matches nothing says so
- [x] #4 A test checks filtering by typing as a user would
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Component PageList (app/src/lib/components/): the pages of a source, each linked to its preview, with a filter field above that narrows by file path and title, case-insensitive. The field appears only once mounted, so without JavaScript the full list shows.
2. Source page uses it instead of its own <ul>.
3. Stories: all pages, filtered by typing, a filter matching nothing, with play functions.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
PageList (app/src/lib/components/PageList.svelte) replaces the page <ul> of the source page; it builds the preview links with resolve() from projectId and sourceId (the lint rule rejects a base URL passed as a prop). The filter field (TextField, type=search) appears only after mount, and matching is a case-insensitive substring of file path or title. Verified: stories 'All pages', 'Filtered by typing' (userEvent.type, clear), 'Filter matching nothing' in make test (544 passed), make lint; by hand in the agent environment: 'roll' leaves runbooks/rollback.md, the server-rendered page has all 4 links and no filter field.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
The page list of a source has a filter field that narrows it by file path and title while typing, and says so when nothing matches; without JavaScript the full list shows as before. The list moved into a new PageList component with stories for all three states. Verified with make test, make lint and by hand.
<!-- SECTION:FINAL_SUMMARY:END -->
