---
id: TASK-238
title: Keep what was typed into a field before the page hydrated
status: To Do
assignee: []
created_date: '2026-11-05 15:27'
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
- [ ] #1 A value typed into a TextField before hydration stays after it
- [ ] #2 An e2e test types before hydration and checks the value
<!-- AC:END -->
