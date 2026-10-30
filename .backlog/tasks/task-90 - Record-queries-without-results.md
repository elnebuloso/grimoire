---
id: TASK-90
title: Record queries without results
status: To Do
assignee: []
created_date: '2026-10-30 02:00'
updated_date: '2026-10-30 02:02'
labels:
  - search
  - agent-api
milestone: m-0
dependencies: []
priority: low
type: feature
ordinal: 152000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
A query that finds nothing is the clearest signal that knowledge is missing or worded differently than agents ask for it (the full-text search does not know synonyms). Today these queries leave no trace. Storing the question text is a privacy decision: agents may put internal details into it.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Before implementing, the user has decided whether the question text is stored or only a count, and for how long
- [ ] #2 Queries over HTTP and MCP that return no snippet are recorded as decided, with project (or none) and time
- [ ] #3 The management area shows the recorded queries, most recent first, or the count
- [ ] #4 Old entries are removed so the table cannot grow without bound
- [ ] #5 Tests cover recording, the zero-hit condition and the cleanup
<!-- AC:END -->
