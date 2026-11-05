---
id: TASK-237
title: Show a visitor the agent command without an Authorization header
status: Done
assignee:
  - '@claude'
created_date: '2026-11-05 15:27'
updated_date: '2026-11-05 15:36'
labels: []
dependencies: []
priority: low
type: bug
ordinal: 299000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
A visitor has no API key and reads public sources without one, yet the claude mcp add command on the start page shows them a placeholder Authorization header.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Signed out, the command on the start page has no Authorization header; signed in it keeps the placeholder
- [x] #2 An e2e or route spec covers both
<!-- AC:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Signed out, the claude mcp add command on the start page connects without the placeholder Authorization header; signed in it keeps it. Taken over from d0c5d33; manage.e2e.ts checks both.
<!-- SECTION:FINAL_SUMMARY:END -->
