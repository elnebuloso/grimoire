---
id: TASK-158
title: Store every timestamp as ISO 8601 UTC with Z
status: Done
assignee:
  - '@claude'
created_date: '2026-10-30 15:32'
updated_date: '2026-10-30 15:38'
labels: []
milestone: m-0
dependencies: []
priority: medium
type: chore
ordinal: 220000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
`api_keys.created_at` is filled by `DEFAULT CURRENT_TIMESTAMP` (`2026-10-30 14:51:00`, no `T`, no zone), while every other timestamp column is written by the application as ISO 8601 with `Z`. Comparing or sorting across columns breaks silently, and `listApiKeys` needs `strftime` to fix the format on every read. The schema is frozen at 1.0, so the format is unified before.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 `api_keys.created_at` holds ISO 8601 UTC with milliseconds and `Z`, like the other timestamp columns
- [x] #2 `listApiKeys` reads the column without converting it
- [x] #3 A test shows the stored format of a newly created key
<!-- AC:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
`api_keys.created_at` defaults to `strftime('%Y-%m-%dT%H:%M:%fZ', 'now')`, the format every other timestamp column already gets from the application; `listApiKeys` reads it as is. No other SQL-side time handling exists. Verified: test of the stored format, `make lint`, `make test` (two full runs 613/613; one earlier run had an unrelated, not reproducible failure in sync.spec.ts, reported to the user).
<!-- SECTION:FINAL_SUMMARY:END -->
