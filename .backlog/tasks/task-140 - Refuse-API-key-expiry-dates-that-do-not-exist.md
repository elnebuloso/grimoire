---
id: TASK-140
title: Refuse API key expiry dates that do not exist
status: To Do
assignee: []
created_date: '2026-10-30 10:55'
labels:
  - admin
milestone: m-0
dependencies: []
priority: low
type: bug
ordinal: 202000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Found in the second whole-project code review of 2026-10-30. `isDate` in `app/src/routes/manage/api-keys/+page.server.ts` (around lines 42-44) checks `YYYY-MM-DD` and `Date.parse`, which rolls `2026-02-31` over to 3 March, so the date passes and the key list shows "Mar 3, 2026", while the key itself, compared as a string, stops on 1 March. The browser date input prevents such values; a hand-made POST does not.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 A `validUntil` that is not a real calendar date (e.g. `2026-02-31`, `2026-13-01`) is refused with the existing invalid-date message
- [ ] #2 Real dates, including 29 February in a leap year, are still accepted
- [ ] #3 A test covers both
<!-- AC:END -->
