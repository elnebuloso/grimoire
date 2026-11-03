---
id: TASK-231
title: >-
  Split INSTANCE_NAME into INSTANCE_TITLE for people and INSTANCE_NAME for
  agents, logo in the header
status: Done
assignee:
  - '@claude'
created_date: '2026-11-03 01:34'
updated_date: '2026-11-03 01:41'
labels:
  - ops
dependencies: []
priority: medium
type: enhancement
ordinal: 293000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
One variable named the instance for people (header, page titles, mails) and for agents (MCP server name, instructions, the server name in `claude mcp add`). Operators want a readable title such as "Acme Docs" for people and a short, stable name for agents. The header shows the logo instead of a text wordmark; the start page gets the title as its heading.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 `INSTANCE_TITLE` (default `grimoire`) names the instance in page titles, the start page h1, page headings and mails
- [x] #2 `INSTANCE_NAME` (default `grimoire`) is used only for the MCP server name, the agent instructions and the server name in the `claude mcp add` command
- [x] #3 The header shows the logo, linking to the start page, with the title as its accessible name
- [x] #4 The handbook describes both variables, what changing `INSTANCE_NAME` later affects, and that an upgrade needs `INSTANCE_TITLE` to keep a custom title
- [x] #5 Tests show the title and the name going to their own places
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. env.ts: INSTANCE_TITLE (default grimoire); INSTANCE_NAME described for agents only.
2. Layout data instanceTitle; PageHead, page headings, source page and mails use the title; MCP, /instructions and mcpName keep INSTANCE_NAME.
3. Header: logo (favicon.svg) with the title as alt, DESIGN.md first.
4. Start page h1 from the title, Sources becomes h2.
5. .env.example, handbook docker.md; specs, stories and e2e.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
INSTANCE_NAME is stored nowhere (database, keys, URLs). Changing it later breaks no connection; agents see the new name from their next connect, and the claude mcp add command offers the new one. That Claude Code names tools after the client-side name from claude mcp add, not after serverInfo.name, is from Claude Code's behaviour as known, not verified in this project.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
New INSTANCE_TITLE (default grimoire) names the instance for people: tab and page titles, the new start page h1 (Sources became h2), the logo's accessible name, labels on the source page, and the reset and invitation mails. INSTANCE_NAME (default grimoire) now only names the MCP server, the agent instructions and the server in the claude mcp add command. The header shows the logo (favicon.svg, 32px) instead of the text wordmark; DESIGN.md updated first. docker.md documents both, what changing the name later affects, and that an upgrade needs INSTANCE_TITLE to keep a custom title; .env.example lists both. Tests: page.spec checks the connect command uses INSTANCE_NAME while the title differs; mail specs mock INSTANCE_TITLE; Storybook default page data renamed. make lint, make test (802), make e2e (23), make handbook pass; checked in the agent environment with INSTANCE_TITLE=Acme Docs and INSTANCE_NAME=acme, light and dark.
<!-- SECTION:FINAL_SUMMARY:END -->
