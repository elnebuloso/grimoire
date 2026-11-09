---
id: TASK-90
title: Record queries without results
status: Done
assignee:
  - '@claude'
created_date: '2026-10-30 02:00'
updated_date: '2026-10-30 02:25'
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
- [x] #1 Before implementing, the user has decided whether the question text is stored or only a count, and for how long
- [x] #2 Queries over HTTP and MCP that return no snippet are recorded as decided, with project (or none) and time
- [x] #3 The management area shows the recorded queries, most recent first, or the count
- [x] #4 Old entries are removed so the table cannot grow without bound
- [x] #5 Tests cover recording, the zero-hit condition and the cleanup
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Migration 0015: missed_queries (question, project slug or NULL, asked_at) with an index on asked_at.
2. lib/server/missed-queries.ts: recordMissedQuery prunes entries older than 30 days and beyond the newest 10,000 (a looping agent must not fill the disk within the 30 days); listMissedQueries groups by question and project with count and last time, newest first, capped.
3. operations.ts: queryProjects marks a result without hits; agentQuery records it. HTTP routes and MCP call agentQuery; the admin 'Try a query' page keeps calling queryProjects, so trying does not count. An unknown project is not recorded.
4. Page /manage/missed-queries in the nav; each entry links to 'Try a query' with the question.
5. Tests: record/prune/group with pinned clock, agentQuery records only misses, HTTP route records, admin page does not.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Decided with the user: store the question text, project and time; delete entries older than 30 days.

Migration 0015 adds missed_queries. queryProjects now returns missed; agentQuery records a miss and is what the HTTP routes and the MCP tool call, while 'Try a query' keeps calling queryProjects. Pruning runs on every insert: older than 30 days, and beyond the newest 10,000 rows. The page groups by question and project (count, last asked), newest first, max 200 rows, each linking to Try a query. Verified: missed-queries.spec (grouping, 30-day cutoff, 10,000 cap), agent-api.spec (HTTP records misses only, unknown project not recorded; MCP records), query.spec (admin page records nothing), make lint, make test; by hand in the agent environment with two HTTP and one MCP miss.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Agent queries over HTTP and MCP that find nothing are recorded with question, project and time and listed under 'Queries without results' in the management area, grouped with a count and linked to Try a query. Entries older than 30 days and beyond the newest 10,000 are deleted, as decided with the user. Handbook explains what is stored and for how long. Verified with unit and route tests, make lint, make test and by hand.
<!-- SECTION:FINAL_SUMMARY:END -->
