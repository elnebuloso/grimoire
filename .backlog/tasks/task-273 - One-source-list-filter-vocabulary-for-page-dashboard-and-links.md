---
id: TASK-273
title: 'One source-list filter vocabulary for page, dashboard and links'
status: To Do
assignee: []
created_date: '2026-11-06 15:56'
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
- [ ] #1 The attention groups decide state kinds with `sourceState`, so a group count equals the row count of its "Show all" list
- [ ] #2 The page options and the "Show all" links are built from one exported list of filter values next to `SOURCE_LIST`
- [ ] #3 A spec covers a source that is both paused and failing
<!-- AC:END -->
