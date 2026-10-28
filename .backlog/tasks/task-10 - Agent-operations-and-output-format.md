---
id: TASK-10
title: Agent operations and output format
status: To Do
assignee: []
created_date: '2026-10-28T19:31:00Z'
labels:
  - agent-api
milestone: m-0
dependencies:
  - TASK-9
documentation:
  - docs/konzept.md
priority: high
type: feature
ordinal: 10000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
HTTP and MCP offer the same four operations and must answer identically, so the operations and their Markdown output live in one place. The instructions text sits permanently in agent context, so it stays short and is maintained once for both channels.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 `projects` lists projects with their short description
- [ ] #2 `index <project>` lists pages and sections with their IDs
- [ ] #3 `query` returns snippets in the format of `docs/konzept.md`: heading with title path, `Source:` line with the ID, `Edit:` line with Git URL without credentials, branch and file
- [ ] #4 `read` returns a whole page or a single section by ID; an unknown ID returns a clear not-found message
- [ ] #5 The agent instructions text exists once, is under 250 tokens and is used by both HTTP and MCP
- [ ] #6 Tests cover each operation
<!-- AC:END -->
