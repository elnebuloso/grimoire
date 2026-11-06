---
id: TASK-290
title: 'DataTable: show the applied sort, no stale search'
status: To Do
assignee: []
created_date: '2026-11-06 15:59'
labels:
  - admin
dependencies: []
priority: low
type: bug
ordinal: 352000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The server falls back to `spec.defaultSort` or the first key of `spec.sorts` (`app/src/lib/list.ts`); `DataTable.svelte` falls back to its own `defaultSort` prop or the first sortable column. The default is written twice per list (e.g. `"-asked"` in `manage/missed-queries/+page.server.ts` and `+page.svelte`). An unknown `?sort=` is ignored by the server, while the table marks no column. Reordering columns or changing one of the two defaults makes the arrow mark a column the list is not sorted by.

The search is debounced with a timer that is never cleared on destroy; when it fires, `show()` builds its URL from `page.url` at that moment, so typing and then clicking another management page within 300 ms opens that page with `?search=` set. The field is bound with `value={params.get("search")}`, so when a slow load finishes the field is reset to the text that load was asked for, overwriting what was typed meanwhile (`TextField` avoids this with `defaultValue`). Both reasoned, not reproduced.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 `listPage` returns the applied sort (key and direction) and `DataTable` renders it; the `defaultSort` prop is gone
- [ ] #2 The search timer is cleared when the table is destroyed
- [ ] #3 Text typed while a load is running is kept
<!-- AC:END -->
