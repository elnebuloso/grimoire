---
id: TASK-241
title: Drop private visibility and source owners; only admins manage sources
status: To Do
assignee:
  - '@claude'
created_date: '2026-11-05 16:15'
updated_date: '2026-11-05 16:15'
labels:
  - admin
dependencies:
  - TASK-240
priority: high
type: feature
ordinal: 303000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Implements ADR 0010. Today a source is `private`, `internal` or `public` and has an owner who may manage it next to admins (`mayManageSource`, `owner_id` on `sources`); reading paths filter private sources by the key owner. The released migrations are never edited; `export-schema-4.grimoire-export` must still import.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 A source is `internal` or `public`; a new source starts `internal`; the source form offers only these two
- [ ] #2 Upgrading a database turns every `private` source into `internal` and removes the owner of sources; API keys keep their owner
- [ ] #3 Without a key, requests read public sources; a key of any user reads public and internal ones, all or its selection
- [ ] #4 The whole management area needs the role `admin`; a user without it is sent to `/` after login and keeps `/account`
- [ ] #5 The duplicate message always names the existing source
- [ ] #6 Deleting a user revokes their keys and ends their sessions, nothing else changes hands
- [ ] #7 An export from 1.4.0 (`export-schema-4.grimoire-export`) still imports
- [ ] #8 Handbook pages, the agent environment fixture and its rule file describe only the two levels
<!-- AC:END -->
