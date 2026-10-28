---
id: TASK-13
title: MCP server
status: To Do
assignee: []
created_date: '2026-10-28T19:32:00Z'
labels:
  - agent-api
milestone: m-0
dependencies:
  - TASK-10
  - TASK-11
documentation:
  - docs/konzept.md
priority: high
type: feature
ordinal: 13000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
MCP is the main channel for agents: connect with URL and API key, nothing to install, works in Claude Code, Claude Desktop, claude.ai, Cursor and others. The server instructions land in agent context automatically, so no `CLAUDE.md` block is needed.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 MCP server runs in the same app via the official TypeScript SDK over Streamable HTTP
- [ ] #2 Tools `projects`, `index`, `query` and `read` are offered; `read` accepts IDs with `#anchor`
- [ ] #3 Server instructions are the same text as `GET /instructions`
- [ ] #4 Access requires a valid API key and respects its scope
- [ ] #5 Verified by connecting a real MCP client and calling each tool
<!-- AC:END -->
