---
id: TASK-295
title: 'Test gaps: Toast story clock race, export on a file database'
status: Done
assignee:
  - '@claude'
created_date: '2026-11-06 15:59'
updated_date: '2026-11-06 18:47'
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
- [x] #1 The Toast story measures from the hover (e.g. mount empty, hover the region, then add the toast) and does not depend on wall-clock timing
- [x] #2 An export spec runs on a temporary file database with rows still in the WAL, or the WAL patch no longer exists
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Toast story: a long duration keeps the timer from mount out of the story; setTimeout and clearTimeout are stubbed after mount, so hovering must clear the timer and set none, and unhovering sets one that the story runs at will
2. The WAL item is void: TASK-271 removed the byte patch, and instance-export.spec exports a WAL file database
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
- Storybook's deferred mount (play destructuring mount) does not reach through the Svelte CSF wrapper (MountMustBeDestructuredError), so the clock is stubbed after mount instead; the timer started at mount has 10 minutes and never fires within the story.
- Ran the Toast stories three times in both schemes: green each time, no real waiting.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
The Toast hover story no longer depends on wall-clock timing: it stubs the timers after mount and checks that hovering clears the dismissal timer and unhovering starts a new one, which the story runs itself. The WAL item was already settled by TASK-271 (no byte patch; a spec exports a WAL file database).
<!-- SECTION:FINAL_SUMMARY:END -->
