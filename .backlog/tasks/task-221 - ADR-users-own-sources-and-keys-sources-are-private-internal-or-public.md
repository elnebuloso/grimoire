---
id: TASK-221
title: 'ADR: users own sources and keys, sources are private, internal or public'
status: Done
assignee:
  - '@claude'
created_date: '2026-11-03 00:29'
updated_date: '2026-11-03 00:32'
labels:
  - admin
milestone: m-2
dependencies: []
references:
  - docs/decisions/0003-users-with-roles.md
  - docs/decisions/0004-sources-public-or-private.md
priority: high
type: docs
ordinal: 283000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Until now only admins exist: API keys belong to the instance, and ADR 0004 makes a source public or private, where private means "readable with any API key". More people are to use the instance as a central documentation; each manages their own sources and creates their own keys, so the admin is no bottleneck. That changes who may read a source: private has to mean "only its owner", and the old meaning becomes a third level. Agreed in chat: the role `user` is implicit for every account and only `admin` is stored; sources and keys have an owner, existing ones go to the first admin; levels `private` (only keys of the owner), `internal` (any key of a logged-in user), `public` (anyone, no key); a new source starts `private`; lists show only what the viewer may read, admins see every source in the management area; keys of an admin do not read other users' private sources (managing happens in the UI, a key is a long-lived secret that sits in tool configs and leaks more easily than a session); deleting a user hands their sources to the deleting admin and revokes their keys.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 A new ADR records owners of sources and keys, the three visibility levels and who may read, list, change and delete a source
- [x] #2 It states that admin keys do not read other users' private sources, with the reasoning, and names "admin keys read everything" as a rejected alternative
- [x] #3 ADR 0004 carries a `Superseded by` line pointing to the new ADR
- [x] #4 The new ADR follows the ADR rules (metadata table, no project-internal names) and stays `Proposed` until the user accepts it
<!-- AC:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Added docs/decisions/0007-users-own-sources-and-keys.md (Proposed): owners for sources and keys, private/internal/public, admin keys follow the same rule, deletion hands sources to the deleting admin. ADR 0004 gains a 'Superseded by' row for who may read a source; its decision that sources are the only unit stays.
<!-- SECTION:FINAL_SUMMARY:END -->
