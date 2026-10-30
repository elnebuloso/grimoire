---
id: TASK-86
title: >-
  Fix small edge cases in the agent API: empty project, empty section, unescaped
  Markdown
status: Done
assignee:
  - '@claude'
created_date: '2026-10-30 01:34'
updated_date: '2026-10-30 01:55'
labels:
  - agent-api
milestone: m-0
dependencies: []
references:
  - app/src/lib/server/agent/mcp.ts
  - app/src/lib/server/agent/operations.ts
  - app/src/lib/server/grimoire-id.ts
  - 'app/src/routes/p/[project]/[source]/[...page]/+server.ts'
priority: low
type: bug
ordinal: 148000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Found by a code review on 2026-10-30.

- **Empty `project` over MCP**: the MCP `search` tool schema in `app/src/lib/server/agent/mcp.ts` uses `z.string().optional()`, so `project: ""` passes. `queryProjects` in `operations.ts` skips the visibility check because `""` is falsy, and `searchSnippets` then filters on `slug = ''`. The agent gets "No results" instead of "project not found". Over HTTP the route parameter cannot be empty.
- **Empty section**: over HTTP, `?section=` (empty) on `app/src/routes/p/[project]/[source]/[...page]/+server.ts` returns the whole page, while over MCP the ID `…#` with an empty anchor (`grimoire-id.ts`) returns 404. The two adapters disagree on one input.
- **Unescaped Markdown**: page titles and descriptions go into the generated Markdown unescaped (`indexProject` and `llmsTxt` in `operations.ts`). A title containing `]` breaks its `llms.txt` link – the one output third-party tools parse.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 MCP `search` with `project: ""` is rejected or answered like an unknown project, never with an unscoped-looking "No results"
- [x] #2 An empty section is treated the same over HTTP and MCP
- [x] #3 A page title containing `[` or `]` yields a valid link in `llms.txt` (and in the index)
- [x] #4 Each case has a test that fails on the old code
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Empty project: fix in `queryProjects` (shared by MCP and HTTP), checking `project !== undefined` instead of truthiness, so "" gets "Project \"\" not found".
2. Empty section: already settled in TASK-82 (`readById` treats an empty anchor as none; test "reads the whole page for an empty anchor").
3. Escape `\`, `[` and `]` in llms.txt link text.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
The index lists titles as plain text after the ID, not as links, so a `]` breaks nothing there and it is left unescaped; only llms.txt has link text. The empty project is fixed in `queryProjects` rather than in the MCP schema, so every caller gets it. New tests for 1 and 3 failed on the old code; the test for 2 came with TASK-82 and failed on the code before it. 445 server tests and make lint pass; agent environment: MCP `query` with `project: ""` answers `Project "" not found`.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
An empty `project` in a search is now answered like an unknown project instead of an empty result. Brackets and backslashes in page titles are escaped in llms.txt link text, so the link stays valid. An empty section reads the whole page over HTTP and MCP alike (done with TASK-82). Covered by tests that fail on the old code, the full server suite, make lint and an MCP request against the agent environment.
<!-- SECTION:FINAL_SUMMARY:END -->
