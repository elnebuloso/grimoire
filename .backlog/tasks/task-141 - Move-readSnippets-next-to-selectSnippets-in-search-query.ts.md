---
id: TASK-141
title: Move readSnippets next to selectSnippets in search/query.ts
status: Done
assignee:
  - '@claude'
created_date: '2026-10-30 10:55'
updated_date: '2026-10-30 11:17'
labels:
  - search
milestone: m-0
dependencies: []
priority: low
type: chore
ordinal: 203000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Found in the second whole-project code review of 2026-10-30. `app/src/lib/server/admin/status.ts` (line 2) imports `readSnippets` from `app/src/lib/server/agent/operations.ts`, so the management area depends on the agent transport layer for a plain read helper. `readSnippets` is a `selectSnippets` call and belongs next to it in `app/src/lib/server/search/query.ts`, which both `agent/` and `admin/` already import from.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 `readSnippets` lives in `app/src/lib/server/search/query.ts`; `admin/` no longer imports from `agent/`
- [x] #2 Behaviour is unchanged; existing tests pass
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
Move readSnippets unchanged from agent/operations.ts to search/query.ts below selectSnippets; agent/operations.ts and admin/status.ts import it from there.
<!-- SECTION:PLAN:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
readSnippets now lives in search/query.ts next to selectSnippets; admin/status.ts imports it and renderSnippet from there, so no non-test module in admin/ imports from agent/ any more (status.spec.ts still imports readById to compare against). No behaviour change: eslint and all 559 server and route specs pass.
<!-- SECTION:FINAL_SUMMARY:END -->
