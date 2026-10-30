---
id: TASK-86
title: >-
  Fix small edge cases in the agent API: empty project, empty section, unescaped
  Markdown
status: To Do
assignee: []
created_date: '2026-10-30 01:34'
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
- [ ] #1 MCP `search` with `project: ""` is rejected or answered like an unknown project, never with an unscoped-looking "No results"
- [ ] #2 An empty section is treated the same over HTTP and MCP
- [ ] #3 A page title containing `[` or `]` yields a valid link in `llms.txt` (and in the index)
- [ ] #4 Each case has a test that fails on the old code
<!-- AC:END -->
