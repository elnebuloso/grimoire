---
id: TASK-229
title: 'Handbook: users, invites and source visibility'
status: To Do
assignee: []
created_date: '2026-11-03 00:30'
labels:
  - admin
milestone: m-2
dependencies:
  - TASK-226
  - TASK-228
documentation:
  - docs/handbook/
priority: medium
type: docs
ordinal: 291000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The handbook knows only the admin. Users need a page of their own for their sources and keys, admins need inviting and managing users, and both need the three visibility levels.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 A page for the role user covers own sources, the visibility levels and own API keys with their counts
- [ ] #2 The admin pages cover inviting, resending, revoking, promoting and deleting users, including what deleting hands over
- [ ] #3 New pages have an entry in `nav` in `zensical.toml` and `make handbook` passes
<!-- AC:END -->
