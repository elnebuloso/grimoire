---
id: TASK-156
title: Public and private sources
status: To Do
assignee: []
created_date: '2026-10-30 14:51'
updated_date: '2026-10-30 14:54'
labels:
  - agent-api
  - admin
milestone: m-0
dependencies:
  - TASK-155
priority: high
type: feature
ordinal: 218000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Some documentation may be read by anyone, some only with an API key. Visibility is set per source, which is only simple to configure once projects are gone. Making a source public exposes its content to anyone who can reach the instance and cannot be undone for whoever already read it, so new sources start private.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 A source is public or private; new sources are private
- [ ] #2 A request without an API key reads and searches the public sources only
- [ ] #3 A request with an API key sees the public sources plus the ones its key is scoped to; a key for all sources sees everything
- [ ] #4 Without an API key and with no public source, MCP and HTTP answer 401 as today
- [ ] #5 Queries without an API key are not recorded as missed queries
- [ ] #6 The admin area shows and changes the visibility per source; the handbook states who can read what
- [ ] #7 Tests cover the scope with no key, a scoped key and an all-sources key
<!-- AC:END -->
