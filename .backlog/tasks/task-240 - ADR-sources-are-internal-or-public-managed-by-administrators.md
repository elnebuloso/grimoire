---
id: TASK-240
title: 'ADR: sources are internal or public, managed by administrators'
status: Done
assignee:
  - '@claude'
created_date: '2026-11-05 16:15'
updated_date: '2026-11-05 16:15'
labels:
  - admin
dependencies: []
references:
  - docs/decisions/0007-users-own-sources-and-keys.md
  - docs/decisions/0008-one-source-per-repository-path.md
priority: high
type: docs
ordinal: 302000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Private sources (ADR 0007) need per-user permission logic in every reading path, list and message; the instance offers chosen documentation to everyone or to its own people and is not meant to replace the permission system an organisation already has. Agreed in chat: only `public` and `internal`; a new source starts `internal`; visibility switches either way; sources have no owner, only admins add, change, sync and delete them; keys stay per user; an existing `private` source becomes `internal`; the duplicate message always names the existing source.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 A new ADR 0010 records the two visibility levels, sources without owner managed by admins, the upgrade of private sources and the duplicate message, with keeping private sources as the first rejected alternative
- [x] #2 ADR 0007 and ADR 0008 carry a `Superseded by` row naming what ADR 0010 replaces
<!-- AC:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
ADR 0010 (Proposed) records two visibility levels, ownerless sources managed by admins, the upgrade of private sources to internal and the duplicate message; ADR 0007 and 0008 carry Superseded-by rows for the parts it replaces.
<!-- SECTION:FINAL_SUMMARY:END -->
