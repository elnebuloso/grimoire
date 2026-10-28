---
id: TASK-8
title: Polling scheduler
status: To Do
assignee: []
created_date: '2026-10-28T19:31:00Z'
updated_date: '2026-10-28T20:54:00Z'
labels:
  - sync
milestone: m-0
dependencies:
  - TASK-7
documentation:
  - docs/konzept.md
priority: medium
type: feature
ordinal: 8000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Changes in the repos must reach grimoire without webhooks (provider formats differ). Polling runs in the same process; the admin area also needs a way to start a sync immediately.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 All sources are checked periodically; the interval comes from an environment variable and defaults to 5 minutes
- [ ] #2 A source is never synced twice at the same time
- [ ] #3 A sync can be started for a single source on demand
- [ ] #4 One failing source does not stop the others
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Handoff from TASK-7: call `syncSource(database(), sourceId, { key: TOKEN_ENCRYPTION_KEY })` (`app/src/lib/server/sync/sync.ts`) per source; it never throws for sync problems but returns `{ status: unchanged | synced | failed }` and stores errors itself. Sync sources one after another: each holds the write lock while replacing its index.
<!-- SECTION:NOTES:END -->
