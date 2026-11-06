---
id: TASK-326
title: 'Lists: an inherited name as sort parameter must not crash the page'
status: To Do
assignee: []
created_date: '2026-11-06 22:05'
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
- [ ] #1 `sort=__proto__`, `sort=valueOf` and `sort=-constructor` fall back to the default sort like any unknown key
- [ ] #2 Known sort keys work as before
- [ ] #3 A spec in `list.spec.ts` covers inherited names
<!-- AC:END -->
