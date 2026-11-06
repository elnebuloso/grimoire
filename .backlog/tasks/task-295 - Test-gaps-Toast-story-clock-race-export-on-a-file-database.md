---
id: TASK-295
title: 'Test gaps: Toast story clock race, export on a file database'
status: To Do
assignee: []
created_date: '2026-11-06 15:59'
labels: []
dependencies: []
priority: low
type: task
ordinal: 357000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Two test gaps:
- The story "Kept while the pointer rests on it" (`Toast.stories.svelte`) gives the toast 1000 ms from mount (`Toast.svelte`); the hover has to land before the timer fires, then the story sleeps a real 1.5 s. On a loaded machine it can fail without a code change.
- `realStateCopy` in `instance-export.ts` rewrites bytes 18 and 19 because an in-memory database cannot open a WAL image. Every export and import spec opens `":memory:"`, which stays in journal mode `memory`, so the patch is a no-op in all of them; only the e2e export runs it and checks one table. If the export is rebuilt so the patch disappears, this item is void.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 The Toast story measures from the hover (e.g. mount empty, hover the region, then add the toast) and does not depend on wall-clock timing
- [ ] #2 An export spec runs on a temporary file database with rows still in the WAL, or the WAL patch no longer exists
<!-- AC:END -->
