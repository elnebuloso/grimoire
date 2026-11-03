---
id: TASK-222
title: 'Owners for sources and API keys, three visibility levels'
status: Done
assignee:
  - '@claude'
created_date: '2026-11-03 00:29'
updated_date: '2026-11-03 00:43'
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
- [x] #1 Every source and every API key has an owning user; a new source or key belongs to the user who creates it
- [x] #2 A source is `private`, `internal` or `public`; a new source starts `private`
- [x] #3 Upgrading an existing database gives every source and key the first admin as owner and turns `private` sources into `internal`, so existing keys read what they read before
- [x] #4 Migration tests cover an upgraded database with sources and keys
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Migration 0002: visibility column (private/internal/public), private->internal, public->public, drop public; owner_id on sources (ON DELETE SET NULL) and api_keys (ON DELETE CASCADE), existing rows to the first admin.
2. Replace the public flag with visibility in source fields, admin sources, stats, start page, agent HTTP and query scope; three radios on the source page.
3. Set the owner from locals.user (access hook) when a source or key is created.
4. resetAdmin leaves owned rows ownerless; setupAdmin hands ownerless rows to the new admin.
5. Seed a normal user with a key and a private source in the agent environment.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Owner columns are nullable: an instance can lose its last admin (resetAdmin) or have none at upgrade time. Ownerless sources and keys go to the admin the next setup creates. Until TASK-223 the read rule is unchanged: any key still reads private and internal sources.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Migration 0002-owners-and-visibility.sql adds sources.visibility (private/internal/public, default private) replacing sources.public, and owner_id on sources and api_keys; existing private sources become internal and everything goes to the first admin. New sources and keys are owned by the logged-in user (locals.user, set in the access hook). The source page offers the three levels. resetAdmin keeps sources and keys for the next setup. Tests: migrate.spec (upgrade with and without admin, default private), auth.spec (reset hands over), sources.spec (owner kept on save, every level), source-fields.spec (unknown level reads as private), api-keys.spec (owner). make test --changed and svelte-check pass.
<!-- SECTION:FINAL_SUMMARY:END -->
