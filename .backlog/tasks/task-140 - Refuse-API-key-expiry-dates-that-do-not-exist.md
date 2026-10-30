---
id: TASK-140
title: Refuse API key expiry dates that do not exist
status: Done
assignee:
  - '@claude'
created_date: '2026-10-30 10:55'
updated_date: '2026-10-30 11:15'
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
- [x] #1 A `validUntil` that is not a real calendar date (e.g. `2026-02-31`, `2026-13-01`) is refused with the existing invalid-date message
- [x] #2 Real dates, including 29 February in a leap year, are still accepted
- [x] #3 A test covers both
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
isDate additionally requires that the parsed date formats back (toISOString) to the same YYYY-MM-DD; tests for 2027-02-31, 2027-02-29, 2026-13-01 refused and 2028-02-29 accepted.
<!-- SECTION:PLAN:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
API key expiry dates must now read back unchanged after parsing, so 2027-02-31 and 2027-02-29 (rolled over by Date before) are refused with the existing YYYY-MM-DD message; 2026-13-01 was already refused and is now covered too. 29 February of a leap year (2028-02-29) is accepted. The two rollover cases fail against the old code; all 17 API key specs pass.
<!-- SECTION:FINAL_SUMMARY:END -->
