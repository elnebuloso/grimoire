---
id: TASK-127
title: Cap the length of agent questions before searching and recording misses
status: Done
assignee:
  - '@claude'
created_date: '2026-10-30 09:45'
updated_date: '2026-10-30 10:12'
labels:
  - agent-api
  - search
milestone: m-0
dependencies: []
priority: medium
type: bug
ordinal: 189000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Found in the whole-project code review of 2026-10-30. The MCP `query` tool (`app/src/lib/server/agent/mcp.ts` around line 313) accepts a question of any length, and every query without a result is stored by `app/src/lib/server/missed-queries.ts` (around line 24). Up to 10,000 stored misses of up to the request body size each amount to gigabytes, filled by a single API key holder. The same unbounded string also becomes an FTS `OR` expression with one term per word (`app/src/lib/server/search/query.ts` lines 379-382). The limit belongs in the shared operation so the HTTP and MCP transports behave the same.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Questions are cut to a fixed maximum length (a few hundred characters) in the shared query operation, for both HTTP and MCP
- [ ] #2 The stored missed query never exceeds that length
- [ ] #3 The number of terms turned into the FTS expression is bounded
- [ ] #4 Tests cover an over-long question on the operation and the stored miss
- [ ] #5 The handbook page on the agent API mentions the limit
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
Cut options.query to MAX_QUESTION_LENGTH (500) in agentQuery, which both HTTP routes and the MCP tool call; the cut question is searched and stored. FTS terms are bounded by the length. Test on agentQuery; handbook agents.md.
<!-- SECTION:PLAN:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
agentQuery, the shared operation behind GET /query, GET /p/<project>/query and the MCP query tool, cuts the question to 500 characters before searching and before recording a miss, so the stored miss and the number of FTS terms (at most one per word) are bounded. The admin query page keeps the uncut queryProjects. Test: an 11,000-character question is stored as 500 characters; fails without the change. Handbook agents.md names the limit.
<!-- SECTION:FINAL_SUMMARY:END -->
