---
id: TASK-87
title: 'Admin: try a query as an agent would see it'
status: To Do
assignee: []
created_date: '2026-10-30 02:00'
updated_date: '2026-10-30 02:02'
labels:
  - admin
  - search
milestone: m-0
dependencies: []
references:
  - app/src/lib/server/agent/operations.ts
  - app/src/lib/server/search/query.ts
priority: medium
type: feature
ordinal: 149000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
An admin can see a source's pages and a Markdown preview, but cannot check what an agent actually gets back for a question. Whether a page is found, ranked well or cut off by the token budget is only visible by calling `/query` with an API key by hand. Trying queries in the management area is the shortest loop for improving the docs themselves.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 The management area has a form with a question, an optional project and a token budget (default 3,000)
- [ ] #2 Submitting it shows the same Markdown answer `query` returns over HTTP and MCP, including the line with the IDs that no longer fit
- [ ] #3 Searching without a project searches all projects; no API key is needed, the admin role decides access
- [ ] #4 An empty question shows a validation message instead of a result
- [ ] #5 Tests cover the action, and a story covers each state of any new component
<!-- AC:END -->
