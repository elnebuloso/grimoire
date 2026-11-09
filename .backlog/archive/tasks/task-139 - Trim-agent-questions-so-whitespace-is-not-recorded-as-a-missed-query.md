---
id: TASK-139
title: Trim agent questions so whitespace is not recorded as a missed query
status: Done
assignee:
  - '@claude'
created_date: '2026-10-30 10:55'
updated_date: '2026-10-30 11:14'
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
- [x] #1 A question of only whitespace is not recorded as a missed query on either transport
- [x] #2 A normal question with surrounding whitespace is searched and recorded trimmed
- [x] #3 A test covers the whitespace-only question
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
agentQuery trims the question before cutting it to MAX_QUESTION_LENGTH and records a miss only for a non-empty question; covers MCP and HTTP alike.
<!-- SECTION:PLAN:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
agentQuery now trims the question before cutting it to 500 characters and records a miss only when something is left, so a whitespace-only MCP query (accepted by z.string().min(1)) no longer shows up as a missed query; HTTP already refused it in queryOptions. New operations.spec test: "  release process \n" is recorded as "release process", " \t " not at all; it fails against the old code. 67 agent specs pass.
<!-- SECTION:FINAL_SUMMARY:END -->
