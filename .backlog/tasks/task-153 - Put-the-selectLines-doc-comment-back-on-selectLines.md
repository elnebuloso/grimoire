---
id: TASK-153
title: Put the selectLines doc comment back on selectLines
status: Done
assignee:
  - '@claude'
created_date: '2026-10-30 13:41'
updated_date: '2026-10-30 14:06'
labels:
  - parsing
milestone: m-0
dependencies: []
priority: low
type: chore
ordinal: 215000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Found by the whole-project code review of 2026-10-30 (13:25). In `app/src/lib/server/parsing/include.ts` the doc comment of `selectLines` ("Ranges like `:4:6,-2:` – 1-based and inclusive, negative counts from the end, `0` means 1.") sits directly above the doc comment of `splitSelection`, left behind when `splitSelection` was inserted. `selectLines` itself has no doc comment, so editors show nothing for it and two stacked comments above `splitSelection`.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 The comment sits directly above `function selectLines`; `splitSelection` carries only its own doc comment
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Move the doc comment from above `splitSelection` to directly above `function selectLines`.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Checked in the file: `splitSelection` carries only its own doc comment, the ranges comment sits on `selectLines`; Prettier check passes.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
The doc comment of `selectLines` in `parsing/include.ts` sits on `selectLines` again instead of stacked above the doc comment of `splitSelection`.
<!-- SECTION:FINAL_SUMMARY:END -->
