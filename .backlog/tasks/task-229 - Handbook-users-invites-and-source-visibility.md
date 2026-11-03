---
id: TASK-229
title: 'Handbook: users, invites and source visibility'
status: Done
assignee:
  - '@claude'
created_date: '2026-11-03 00:30'
updated_date: '2026-11-03 01:17'
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
- [x] #1 A page for the role user covers own sources, the visibility levels and own API keys with their counts
- [x] #2 The admin pages cover inviting, resending, revoking, promoting and deleting users, including what deleting hands over
- [x] #3 New pages have an entry in `nav` in `zensical.toml` and `make handbook` passes
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. New docs/handbook/users.md for the role user: accepting the invitation, own sources and the three visibility levels, what the management area shows, own API keys with request counts, deleted account.
2. admin.md: start page and visibility rows, managing every source, query and missed queries scope, All API keys, new Users section (invite, resend, withdraw, roles, delete).
3. index.md roles and concepts, agents.md prerequisites and key scope, README connecting agents.
4. nav entry in zensical.toml; make handbook.
<!-- SECTION:PLAN:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
New handbook page users.md (role user): accepting an invitation and its error, own sources and the private/internal/public levels with what cannot be taken back, what the management area shows a user, own API keys including request counts, and what deleting an account does. admin.md now covers managing every source, the Visibility field, the query and missed-query scope, All API keys and a Users section (invite with mail or a link shown once, 7-day links, send again, withdraw, roles and the last admin, irreversible delete). index.md, agents.md and the README describe the levels and own keys. Nav entry added; make handbook (strict) passes.
<!-- SECTION:FINAL_SUMMARY:END -->
