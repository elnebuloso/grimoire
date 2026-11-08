---
id: TASK-378
title: 'Start page: list internal sources to visitors too'
status: To Do
assignee: []
created_date: '2026-11-08 14:26'
labels: []
dependencies: []
priority: medium
type: enhancement
ordinal: 440000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
ADR 0012 decides that the start page shows every source to anyone, so users can tell how much documentation the instance holds before logging in. Today app/src/routes/+page.server.ts filters the catalog with viewerScope('visitor'), so a visitor sees only public sources (deviation found while consolidating the ADRs on 2026-11-08).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 A visitor without login sees every source on the start page with name, description, visibility and stats
- [ ] #2 For an internal source a visitor sees no content and no link to the published documentation (docsUrl stays public-only)
- [ ] #3 Nothing reachable from a listed internal source (source page, try-it links) reveals its content to a visitor
<!-- AC:END -->
