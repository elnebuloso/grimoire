---
id: TASK-222
title: 'Owners for sources and API keys, three visibility levels'
status: To Do
assignee: []
created_date: '2026-11-03 00:29'
labels:
  - admin
milestone: m-2
dependencies:
  - TASK-221
references:
  - app/src/lib/server/db/migrations/0001-initial.sql
priority: high
type: feature
ordinal: 284000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Users are to manage their own sources and keys, and private has to mean "only the owner" (see TASK-221). The schema knows neither an owner nor a third visibility level. The released migration `0001-initial.sql` is never edited.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Every source and every API key has an owning user; a new source or key belongs to the user who creates it
- [ ] #2 A source is `private`, `internal` or `public`; a new source starts `private`
- [ ] #3 Upgrading an existing database gives every source and key the first admin as owner and turns `private` sources into `internal`, so existing keys read what they read before
- [ ] #4 Migration tests cover an upgraded database with sources and keys
<!-- AC:END -->
