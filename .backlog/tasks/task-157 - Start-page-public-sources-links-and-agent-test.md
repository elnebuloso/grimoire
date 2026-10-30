---
id: TASK-157
title: 'Start page: public sources, links and agent test'
status: To Do
assignee: []
created_date: '2026-10-30 14:51'
labels:
  - admin
dependencies:
  - TASK-156
priority: medium
type: feature
ordinal: 219000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Visitors of the start page cannot tell which documentation they may use without a key, and cannot try what an agent would get. With visibility per source, the start page can mark each source and offer the published docs and a query test for the public ones.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 The start page lists every source marked public or private, each with its stats
- [ ] #2 Public sources show their `docs_url` link; private sources show neither `docs_url` nor Git URL
- [ ] #3 Visitors who are not logged in can run an agent query against the public sources, as in the admin query page; private sources are never searched there
- [ ] #4 Tests cover that private content and URLs never reach a visitor who is not logged in
<!-- AC:END -->
