---
id: TASK-241
title: Drop private visibility and source owners; only admins manage sources
status: Done
assignee:
  - '@claude'
created_date: '2026-11-05 16:15'
updated_date: '2026-11-05 16:32'
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
- [x] #1 A source is `internal` or `public`; a new source starts `internal`; the source form offers only these two
- [x] #2 Upgrading a database turns every `private` source into `internal` and removes the owner of sources; API keys keep their owner
- [x] #3 Without a key, requests read public sources; a key of any user reads public and internal ones, all or its selection
- [x] #4 The whole management area needs the role `admin`; a user without it is sent to `/` after login and keeps `/account`
- [x] #5 The duplicate message always names the existing source
- [x] #6 Deleting a user revokes their keys and ends their sessions, nothing else changes hands
- [x] #7 An export from 1.4.0 (`export-schema-4.grimoire-export`) still imports
- [x] #8 Handbook pages, the agent environment fixture and its rule file describe only the two levels
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Migration 0006: private -> internal, new CHECK and default internal, drop sources.owner_id
2. Key reads and start page: every key and every logged-in user reads all sources; selections stay
3. /manage admin-only; drop mayManageSource and per-user filters (dashboard, dead links, missed queries)
4. Duplicate and overlap messages always name the other source; drop the hidden variants
5. Users without admin: login and invite go to /, header links My API keys
6. Specs, stories, e2e, agent seed, rule file and handbook
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Logged-in non-admins visiting /login are sent home (/) instead of seeing the form; invited users land on / since /manage is closed to them. Header shows "My API keys" to users who may not manage. users.md is now "Your API keys"; the duplicate-message section moved to admin.md.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Sources are internal or public (ADR 0010). Migration 0006 turns private into internal, makes internal the default and drops the source owner; API keys keep theirs. Every key reads all sources or its selection; the management area needs the admin role; duplicate messages always name the existing source; deleting a user no longer hands over sources. Handbook, agent fixture and rule file updated. Verified: make lint, make test (922), make e2e (25), make handbook, and by hand in the agent environment (keyless HTTP/MCP see only public, user key reads all four, user gets 403 on /manage).
<!-- SECTION:FINAL_SUMMARY:END -->
