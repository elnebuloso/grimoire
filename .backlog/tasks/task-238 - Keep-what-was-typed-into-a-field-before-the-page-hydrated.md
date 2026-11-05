---
id: TASK-238
title: Keep what was typed into a field before the page hydrated
status: Done
assignee:
  - '@claude'
created_date: '2026-11-05 15:27'
updated_date: '2026-11-05 15:36'
labels: []
dependencies: []
priority: medium
type: bug
ordinal: 300000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
TextField passes its value as value, which Svelte assigns again on hydration, so a field filled before the scripts ran (slow connection) is emptied. Reference: 7493d31 in /workspace/github.com/elnebuloso/grimoire-before-reset.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 A value typed into a TextField before hydration stays after it
- [x] #2 An e2e test types before hydration and checks the value
<!-- AC:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
TextField passes its value as defaultValue, so hydration no longer empties what was typed before it. Taken over from 7493d31 with fillBeforeHydration in manage.e2e.ts, now used in the invitation test of this project.
<!-- SECTION:FINAL_SUMMARY:END -->
