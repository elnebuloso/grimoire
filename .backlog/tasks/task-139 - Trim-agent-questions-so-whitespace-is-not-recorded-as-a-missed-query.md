---
id: TASK-139
title: Trim agent questions so whitespace is not recorded as a missed query
status: To Do
assignee: []
created_date: '2026-10-30 10:55'
labels:
  - agent-api
milestone: m-0
dependencies: []
priority: low
type: bug
ordinal: 201000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Found in the second whole-project code review of 2026-10-30. The MCP `query` tool validates the question with `z.string().min(1)`, which accepts `"   "`. `agentQuery` in `app/src/lib/server/agent/operations.ts` (around lines 175-187) does not trim, so the empty match is recorded as a missed query and shows up for the admins. The HTTP transport trims in `queryOptions` (`app/src/lib/server/agent/http.ts`). Trimming in `agentQuery` covers both transports.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 A question of only whitespace is not recorded as a missed query on either transport
- [ ] #2 A normal question with surrounding whitespace is searched and recorded trimmed
- [ ] #3 A test covers the whitespace-only question
<!-- AC:END -->
