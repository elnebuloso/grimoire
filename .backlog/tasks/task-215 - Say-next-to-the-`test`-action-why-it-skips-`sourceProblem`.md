---
id: TASK-215
title: Say next to the `test` action why it skips `sourceProblem`
status: Done
assignee:
  - '@claude'
created_date: '2026-10-31 13:06'
updated_date: '2026-10-31 13:16'
labels:
  - admin
milestone: m-1
dependencies: []
priority: low
type: chore
ordinal: 277000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
In `app/src/routes/manage/sources/[id]/+page.server.ts`, the `save` action validates the form with `sourceProblem` and checks the remote. The `test` action only calls `checkSourceAccess`, which checks the remote. So a form with an invalid name, or other gaps `sourceProblem` reports, can be tested but not saved. That is intended (access can be tested before the source is named), but nothing next to the code says so, and the next person may "fix" it.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 A one-line comment at the `test` action states why it checks only the remote and not `sourceProblem`
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. One-line comment at the test action: why it checks only the remote.
<!-- SECTION:PLAN:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Added a one-line comment at the test action in routes/manage/sources/[id]/+page.server.ts: it checks only the remote, not sourceProblem, because access can be tested before the source is named. Comment only, no behaviour change.
<!-- SECTION:FINAL_SUMMARY:END -->
