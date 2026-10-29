---
id: TASK-62
title: 'App settings in the admin area, starting with pausing all syncs'
status: Done
assignee:
  - '@claude'
created_date: '2026-10-29 20:31'
updated_date: '2026-10-29 20:49'
labels:
  - admin
  - sync
milestone: m-0
dependencies: []
documentation:
  - docs/decisions/0002-app-settings-in-a-single-row-table.md
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
- [x] #1 The admin area has a settings page, linked from the admin start page, that works without JavaScript
- [x] #2 A switch on the settings page pauses the syncs of all sources and can be switched off again
- [x] #3 While all syncs are paused, polling checks no source, whatever its own schedule or `paused` flag says
- [x] #4 Pausing and resuming all syncs change no setting of any source; after resuming, every source is polled by its own settings again, and a source paused on its own stays paused
- [x] #5 "Sync now" syncs a source once while all syncs are paused; saving a source starts no sync while they are paused
- [x] #6 The admin start page and the source page show that all syncs are paused, and the source page shows no next check then
- [x] #7 Settings are stored in a single-row table `settings` with one typed column per setting and a default, created by a migration; a new database starts with syncs not paused, and the setting survives a restart
- [x] #8 Tests cover polling while paused and after resuming, the untouched source settings, "Sync now" while paused, and storing the setting
- [x] #9 The settings page and the global pause are described in `docs/handbook/admin.md`
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Migration 0008-settings.sql: table settings with id INTEGER PRIMARY KEY CHECK (id = 1) and syncs_paused INTEGER NOT NULL DEFAULT 0 CHECK (syncs_paused IN (0, 1)); inserts the one row.
2. app/src/lib/server/settings.ts: readSettings/saveSettings ({ syncsPaused }).
3. listSchedules (db/sources.ts) returns nothing while syncs_paused is set, so polling checks no source; source rows are never written.
4. Source save and the project wizard request no sync while paused; the sync action and slug changes stay as they are (forced re-index, like for a paused source).
5. /admin/settings page with a checkbox form (no JavaScript), linked from the admin start page; admin start page and source page show the global pause, no next check on the source page then.
6. Messages en/de; tests in settings.spec.ts, projects.spec.ts (admin and routes), a route test for the settings page; docs/handbook/admin.md.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Polling: listSchedules returns no source while settings.syncs_paused is set; the source rows are never written, so their own paused flag and schedule stay. Source save and the project wizard request no sync while paused; "Sync now" and the re-index after a slug change stay as they are. A sync already running when the pause is set finishes. The agent fixture reset (scripts/agent-seed.ts) now resets the settings row to its defaults; .claude/rules/agent-environment.md says so.
Verified in the agent environment with a browser without JavaScript: the settings form pauses and resumes; the admin start page shows the notice, the source page shows the pause and no next check. With source 1 on '* * * * *', no source was checked during 130 s of pause; after resuming, source 1 was checked within the minute; the individually paused platform/next stayed paused and unchecked. "Sync now" synced while paused. A first run looked like checks during the pause: those were checks started before it, which record last_checked_at only when they finish. make lint, make test (397), make build, make e2e (14), make handbook pass.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
The admin area has a settings page (/admin/settings, linked from the admin start page, no JavaScript needed) for settings of the whole instance. They live in a single-row table settings (migration 0008, one typed column per setting with default and CHECK, as recorded in docs/decisions/0002) and so survive a restart.

The first setting pauses all syncs: polling checks no source while it is on, whatever the sources say, and never touches their own paused flag or schedule, so resuming brings back exactly the previous state. Saving a source or creating one in the wizard starts no sync while paused; "Sync now" still syncs once. The admin start page and the source page show the pause, and the source page shows no next check then.

Covered by unit and route tests (polling paused and resumed with untouched sources, save without sync, sync now, wizard, storage across reopening the file, schema keeping one row) and checked by hand in the agent environment. Described in docs/handbook/admin.md.
<!-- SECTION:FINAL_SUMMARY:END -->
