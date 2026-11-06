---
id: TASK-266
title: Schedule field with a plain-language reading of the cron expression
status: Done
assignee:
  - '@claude'
created_date: '2026-11-05 20:46'
updated_date: '2026-11-06 13:42'
labels:
  - admin
milestone: m-3
dependencies:
  - TASK-257
documentation:
  - docs/redesign/ux-konzept.md
priority: low
type: enhancement
ordinal: 328000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The schedule of a source is raw cron syntax (finding U24). Optional measure M19 of the concept.

Measure M19 in the concept. Work on the branch `redesign`; it ships in one merge at the end of the milestone.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 The schedule field shows next to the expression what it means in plain language, and the global default
- [x] #2 An invalid expression is reported at the field as today
- [x] #3 `ScheduleField` has stories with axe
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
Rules (shown to the owner 2026-11-06; translation decided: option a):
1. New component ScheduleField replaces the plain text field in the schedule section.
2. Below the field, while typing: the next three runs computed with croner (already a dependency), dates via Intl in the reader's language; empty field: the same for the global default, introduced by "Global default:".
3. Times in the instance time zone, named.
4. An invalid expression shows only "not a valid schedule yet" while typing; the binding message comes from the server at the field after saving, as today.
5. "Next check" stays.
6. Stories: empty with the global default, own expression, invalid while typing, server error; axe on all.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Built as planned. upcomingRuns in app/src/lib/schedule.ts runs croner in the browser with the same options as the server (5-part, the instance time zone); spec pins the start date. ScheduleField composes TextField and describes the input with the runs (aria-describedby, aria-live). Checked by hand in the agent environment. Handbook admin.md names the hint.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
The schedule field shows below it the next three runs of the typed expression, or of the global default while it is empty, in the instance's time zone; an invalid expression reads "Not a valid schedule yet." while the server still reports the error on save. No new dependency: croner, already used by the scheduler, computes the runs. make lint, make test (1075), make e2e (28) and make handbook pass.
<!-- SECTION:FINAL_SUMMARY:END -->
