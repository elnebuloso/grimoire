---
id: TASK-379
title: 'Setup import: show the sources the target will not reach'
status: To Do
assignee: []
created_date: '2026-11-08 14:26'
labels:
  - ops
dependencies: []
priority: medium
type: bug
ordinal: 441000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
ADR 0009 decides that an import names the sources whose Git host the target refuses, instead of leaving it to their first failed sync. scripts/import.ts prints them, but the browser import on the setup page (app/src/routes/setup/+page.server.ts:79-81) only writes them to the server log and redirects to /login?imported, so the person importing without a shell is never told (deviation found while consolidating the ADRs on 2026-11-08).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 After an import on the setup page, the person importing sees the names of the sources the target will not reach
- [ ] #2 An import without such sources shows no such notice
<!-- AC:END -->
