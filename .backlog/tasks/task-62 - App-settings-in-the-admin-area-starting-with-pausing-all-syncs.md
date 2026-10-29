---
id: TASK-62
title: 'App settings in the admin area, starting with pausing all syncs'
status: To Do
assignee: []
created_date: '2026-10-29 20:31'
labels:
  - admin
  - sync
milestone: m-0
dependencies: []
priority: medium
type: feature
ordinal: 124000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Everything grimoire does instance-wide is set today by environment variables, which an admin can only change by redeploying. The admin wants to change app settings directly in the UI. The first one: one switch that pauses the syncs of all sources, e.g. while a Git server is under maintenance or credentials are being rotated. Without it the admin has to pause every source one by one and later remember which of them were paused before.

Decided with the user:
- The global pause takes precedence over the settings of the sources but never changes them: pausing and resuming leave every source's `paused` flag and schedule as they were.
- It stops polling only, like pausing a single source (TASK-57): "Sync now" still syncs a source once.
- Settings live in SQLite, so they survive a restart of the pod, in a table `settings` with exactly one row and one typed column per setting (type, default and `CHECK` in the schema); a new setting is a new migration. Rejected: a key-value table `settings(key, value)`, which needs no migration per setting but leaves types, defaults and validation to the code alone.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 The admin area has a settings page, linked from the admin start page, that works without JavaScript
- [ ] #2 A switch on the settings page pauses the syncs of all sources and can be switched off again
- [ ] #3 While all syncs are paused, polling checks no source, whatever its own schedule or `paused` flag says
- [ ] #4 Pausing and resuming all syncs change no setting of any source; after resuming, every source is polled by its own settings again, and a source paused on its own stays paused
- [ ] #5 "Sync now" syncs a source once while all syncs are paused; saving a source starts no sync while they are paused
- [ ] #6 The admin start page and the source page show that all syncs are paused, and the source page shows no next check then
- [ ] #7 Settings are stored in a single-row table `settings` with one typed column per setting and a default, created by a migration; a new database starts with syncs not paused, and the setting survives a restart
- [ ] #8 Tests cover polling while paused and after resuming, the untouched source settings, "Sync now" while paused, and storing the setting
- [ ] #9 The settings page and the global pause are described in `docs/handbook/admin.md`
<!-- AC:END -->
