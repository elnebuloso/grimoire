---
id: TASK-326
title: 'Lists: an inherited name as sort parameter must not crash the page'
status: Done
assignee:
  - '@claude'
created_date: '2026-11-06 22:05'
updated_date: '2026-11-06 22:10'
labels:
  - admin
  - search
dependencies: []
references:
  - app/src/lib/list.ts
  - app/src/lib/list.spec.ts
priority: high
type: bug
ordinal: 388000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
`readListParams` in `app/src/lib/list.ts` checks the sort key with `const known = sortKey in spec.sorts;`. `in` also matches properties every object inherits. `GET /?sort=__proto__` makes `spec.sorts['__proto__']` the prototype object, and `listPage` then calls it as a function (`key(a)`), which throws "key is not a function": the page answers 500 and the error is logged. `?sort=valueOf` and `?sort=hasOwnProperty` throw as well (confirmed: `'valueOf' in {}` is true). This happens without login on the public start page `/` (once there are two or more sources) and on `/manage/sources`, `/manage/users`, `/manage/api-keys` and `/manage/missed-queries`.

Suggested fix: `const known = Object.hasOwn(spec.sorts, sortKey);`, with a case next to "falls back on an unknown sort" in `app/src/lib/list.spec.ts`.

Found by the second whole-repo audit on 2026-11-06 (HEAD 06aada8).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 `sort=__proto__`, `sort=valueOf` and `sort=-constructor` fall back to the default sort like any unknown key
- [x] #2 Known sort keys work as before
- [x] #3 A spec in `list.spec.ts` covers inherited names
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Spec: __proto__, valueOf, -constructor and hasOwnProperty fall back to the default sort
2. readListParams checks the key with Object.hasOwn
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
- The spec failed before and passes after; list.spec.ts, page.spec.ts and sources.spec.ts pass (52 tests).
- No other `in` check on a user-given key found in src.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
readListParams now accepts a sort key only when the list defines it itself (Object.hasOwn), so ?sort=__proto__ or ?sort=valueOf fall back to the default sort instead of answering 500 on the start page and every management list. Covered by a spec in list.spec.ts.
<!-- SECTION:FINAL_SUMMARY:END -->
