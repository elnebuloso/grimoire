---
id: TASK-341
title: 'Dead links page: limit the links shown per source'
status: Done
assignee:
  - '@claude'
created_date: '2026-11-06 22:06'
updated_date: '2026-11-06 22:47'
labels:
  - admin
dependencies: []
references:
  - app/src/routes/manage/dead-links/+page.server.ts
  - app/src/lib/server/admin/status.ts
priority: low
type: enhancement
ordinal: 403000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
`/manage/dead-links` (`app/src/routes/manage/dead-links/+page.server.ts`) loads every dead link of every source through `deadLinks` in `app/src/lib/server/admin/status.ts` (no `LIMIT`) and groups them by source. With 300 sources and 30 dead links each, 9,000 rows go into the page data and the DOM on every visit – the same pattern TASK-317 removed from the source Status tab.

Suggested fix: show a limited number of links per source (e.g. 20) with a count and a link to that source's Status tab for the rest, or page the groups with `listPage` from `app/src/lib/list.ts`. New texts need keys in every `app/messages/<locale>.json`.

Found by the second whole-repo audit on 2026-11-06 (HEAD 06aada8).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 The page shows at most a fixed number of dead links per source and how many more there are, with a link to the source
- [x] #2 The page data no longer grows with the total number of dead links beyond that limit
- [x] #3 The route spec covers a source with more dead links than the limit
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Route spec: 25 dead links of one source give 20 listed and a total of 25
2. The load keeps at most SHOWN_PER_SOURCE = 20 links per group and counts the total
3. The page links "N more on the Status tab of the source" to the source page, whose Status tab lists all dead links; message dead_links_more in en and de
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
- dead-links route specs pass (3 tests). The fixture sources have 3 dead links each, so the "more" link is not visible in the agent environment; the e2e run covers the page.
- The query still reads all dead links on the server; only the page data and the DOM are limited, which was the cost named in the task.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
/manage/dead-links now lists at most 20 dead links per source, with "N more on the Status tab of the source" linking to the source, whose Status tab lists all of them. The page data no longer grows with the total number of dead links. Covered by a route spec with 25 dead links.
<!-- SECTION:FINAL_SUMMARY:END -->
