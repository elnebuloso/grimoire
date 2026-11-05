---
id: TASK-237
title: Show a visitor the agent command without an Authorization header
status: To Do
assignee: []
created_date: '2026-11-05 15:27'
labels: []
dependencies: []
priority: low
type: bug
ordinal: 299000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
A visitor has no API key and reads public sources without one, yet the claude mcp add command on the start page shows them a placeholder Authorization header. Reference: d0c5d33 in /workspace/github.com/elnebuloso/grimoire-before-reset.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Signed out, the command on the start page has no Authorization header; signed in it keeps the placeholder
- [ ] #2 An e2e or route spec covers both
<!-- AC:END -->
