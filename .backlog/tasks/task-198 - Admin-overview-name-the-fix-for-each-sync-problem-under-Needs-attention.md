---
id: TASK-198
title: 'Admin overview: name the fix for each sync problem under "Needs attention"'
status: To Do
assignee:
  - '@claude'
created_date: '2026-10-30 23:50'
updated_date: '2026-10-30 23:51'
labels:
  - admin
  - impeccable
dependencies:
  - TASK-197
priority: high
type: enhancement
ordinal: 260000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The Impeccable critique of `/manage` found that a sync error shows its cause verbatim (e.g. `source path "archive/docs" does not exist in the repository`) but not what to do about it, and the list offers no direct way to the place where it is fixed. `docs/PRODUCT.md` makes "the cause and the fix, in words" a product principle, and the admin usually arrives on this page because a sync broke. Sync errors are stored today as English message strings from `app/src/lib/server/sync/`; how a known error is recognised is for the worker to decide.

Carried out by running `/impeccable clarify /manage` (Impeccable skill), as the Action Summary of the critique recommends; the command's playbook governs the design work, this task's acceptance criteria decide when it is done.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Each known sync error (missing source path, branch not found, access refused, server unreachable, indexing deadline exceeded, no page indexed) shows a fix sentence under the cause in "Needs attention"
- [ ] #2 An unknown error still shows its cause and a general next step, never nothing
- [ ] #3 Each problem links to the place on the source page where it is fixed or inspected
- [ ] #4 A source that never synced because its first sync failed is shown as one problem, not as "never synced" plus "sync error"
- [ ] #5 Fix sentences exist in `app/messages/en.json` and `app/messages/de.json`; a spec covers recognising each known error and the unknown case
<!-- AC:END -->
