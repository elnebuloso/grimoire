---
id: TASK-290
title: 'DataTable: show the applied sort, no stale search'
status: Done
assignee:
  - '@claude'
created_date: '2026-11-06 15:59'
updated_date: '2026-11-06 17:30'
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
- [x] #1 `listPage` returns the applied sort (key and direction) and `DataTable` renders it; the `defaultSort` prop is gone
- [x] #2 The search timer is cleared when the table is destroyed
- [x] #3 Text typed while a load is running is kept
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. listPage returns the applied sort (key, descending); DataTable marks the column from it; the defaultSort prop goes
2. The search timer is cleared on destroy
3. The search field takes its text from the URL as defaultValue, so a finishing load does not overwrite what is typed
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
- ListPage.sort is optional: lists built by hand without a sort (invitations, duplicates, the source's pages) mark no column.
- list.spec covers the applied sort, also for an unknown sort in the URL; a story shows a server-applied descending sort on the second column.
- Checked by hand: typing in the source search and opening Users within 300 ms lands on /manage/users without ?search=; /manage/sources?sort=-bogus marks Source ascending, as the server sorts.
- AC #3 is not reproduced: a slow load cannot be staged in the agent environment; defaultValue is the pattern TextField already uses.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
DataTable marks the sort the server applied (listPage now returns it) instead of guessing from its own default; the defaultSort prop is gone. The search timer is cleared when the table is destroyed, so a search no longer follows onto the next page, and the field uses defaultValue so a finishing load keeps what was typed. list.spec and a new story cover the sort; the timer was checked by hand.
<!-- SECTION:FINAL_SUMMARY:END -->
