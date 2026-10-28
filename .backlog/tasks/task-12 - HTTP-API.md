---
id: TASK-12
title: HTTP API
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
ordinal: 12000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Agents without MCP access grimoire via curl or WebFetch, so the API answers in Markdown rather than JSON. HTTP clients never send the URL fragment, so a single section is requested with `?section=` instead of `#`.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Routes exist: `GET /projects`, `/query?q=&tokens=`, `/p/<project>/index`, `/p/<project>/llms.txt`, `/p/<project>/query?q=&tokens=`, `/p/<project>/<source>/<page>` with optional `?section=<anchor>`, `/instructions`
- [ ] #2 Responses are Markdown with `Content-Type: text/markdown`
- [ ] #3 All routes require `Authorization: Bearer <key>` and respect the key scope
- [ ] #4 Unknown projects, pages or sections return 404 with a short Markdown message
- [ ] #5 Tests cover each route
<!-- AC:END -->
