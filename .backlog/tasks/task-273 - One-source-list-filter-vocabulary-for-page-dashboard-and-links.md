---
id: TASK-273
title: 'One source-list filter vocabulary for page, dashboard and links'
status: Done
assignee:
  - '@claude'
created_date: '2026-11-06 15:56'
updated_date: '2026-11-06 17:42'
labels:
  - admin
dependencies: []
priority: medium
type: bug
ordinal: 335000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The values of the source list filters `status` and `warnings` come from `sourceState` through `SOURCE_LIST` (`app/src/lib/server/source-list.ts`). They are written again as options in `app/src/routes/manage/sources/+page.svelte` and a third time as links in `app/src/lib/components/AttentionList.svelte` (`?status=error`, `?status=paused`, `?status=never`, `?warnings=yes`); the `AttentionList` stories assert the same literals a fourth time. A renamed value or parameter makes a "Show all" link open the unfiltered list, because `readListParams` ignores what it does not know.

The groups also decide membership differently: `problems()` in `admin/status.ts` counts every paused source as `paused`, including one that also has an error, while `sourceState` (`lib/source-state.ts`) puts it under `error`. "Show all 7" under paused can open a list of 6. The link appears only above five entries, so the fixture never shows it. `status.spec.ts` has no source that is both paused and failing.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 The attention groups decide state kinds with `sourceState`, so a group count equals the row count of its "Show all" list
- [x] #2 The page options and the "Show all" links are built from one exported list of filter values next to `SOURCE_LIST`
- [x] #3 A spec covers a source that is both paused and failing
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. SOURCE_FILTERS (status and warnings values) and sourceFilterQuery in lib/source-state.ts, shared by server and browser
2. SOURCE_LIST's filters are typed by SOURCE_FILTERS' names, the sources page builds its options from the list, AttentionList and its stories build the Show all links with sourceFilterQuery
3. problems() decides paused and never-synced with sourceState
4. Spec: a paused source with an error counts under errors only, and each group total equals the filtered list
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
- The shared list lives in lib/source-state.ts, not beside SOURCE_LIST in lib/server: AttentionList runs in the browser and cannot import a server module. SOURCE_LIST's filter record is typed by its names, so renaming one breaks the build.
- The spec failed without the status.ts change (paused group 2 vs list 1) and passes with it.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
The dashboard's attention groups now decide paused and never-synced with sourceState, so a paused source with a sync error is listed under errors only and every group count matches its Show all list. The filter values of the source list are defined once (SOURCE_FILTERS, sourceFilterQuery) and used by the list's options, the Show all links and their stories. Spec added; it failed before the fix.
<!-- SECTION:FINAL_SUMMARY:END -->
