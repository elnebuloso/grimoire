---
id: TASK-341
title: 'Dead links page: limit the links shown per source'
status: To Do
assignee: []
created_date: '2026-11-06 22:06'
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
- [ ] #1 The page shows at most a fixed number of dead links per source and how many more there are, with a link to the source
- [ ] #2 The page data no longer grows with the total number of dead links beyond that limit
- [ ] #3 The route spec covers a source with more dead links than the limit
<!-- AC:END -->
