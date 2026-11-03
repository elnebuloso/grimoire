---
id: TASK-223
title: Read access by visibility and key owner
status: To Do
assignee: []
created_date: '2026-11-03 00:29'
labels:
  - admin
milestone: m-2
dependencies:
  - TASK-222
references:
  - app/src/lib/server/agent/
  - app/src/routes/+page.server.ts
priority: high
type: feature
ordinal: 285000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
With three visibility levels and keys owned by users, every reading path has to apply the same rule, or a private source leaks through the one path that was missed.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Without a key, the HTTP API, MCP and the start page read and list only `public` sources
- [ ] #2 A key reads `public` and `internal` sources and the `private` sources of its owner, within its own selection; "all sources" means all of these
- [ ] #3 A key of an admin does not read another user's `private` source
- [ ] #4 The start page lists for a logged-in user `public`, `internal` and their own `private` sources, for a visitor only `public` ones
- [ ] #5 The query page of the management area searches what the logged-in user may read
- [ ] #6 Tests cover each level for a visitor, the owner's key, another user's key and an admin's key
<!-- AC:END -->
