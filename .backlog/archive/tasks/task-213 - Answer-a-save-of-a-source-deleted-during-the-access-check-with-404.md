---
id: TASK-213
title: Answer a save of a source deleted during the access check with 404
status: Done
assignee:
  - '@claude'
created_date: '2026-10-31 13:06'
updated_date: '2026-10-31 13:10'
labels:
  - admin
milestone: m-1
dependencies: []
priority: medium
type: bug
ordinal: 275000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The `save` action in `app/src/routes/manage/sources/[id]/+page.server.ts` looks up the source, may then wait up to 15 s on the Git access check (`ACCESS_TIMEOUT_MS` in `app/src/lib/server/admin/source-access.ts`), and then calls `saveSource`. If another tab deletes the source during that wait, the `UPDATE` changes no row and `saveSource` throws `there is no source <id>` (`app/src/lib/server/admin/sources.ts`, ~line 302). The admin gets the bare error page with a 500, and the log records an unknown error.

The `slug` action already handles this case: `changeSourceSlug` returns `'not-found'` and the action answers `error(404)`.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 `saveSource` returns `'not-found'` instead of throwing when the source no longer exists
- [x] #2 The `save` action answers `not-found` with a 404
- [x] #3 A regression test saves a source that was deleted after the action looked it up and gets a 404
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Regression test in the route spec: the access check deletes the source, the save must answer 404.
2. saveSource returns 'not-found' when the UPDATE changes no row.
3. The save action answers 'not-found' with error(404), as the slug action does.
<!-- SECTION:PLAN:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
saveSource returns 'not-found' instead of throwing when the UPDATE changes no row; the save action answers it with error(404), as the slug action does. Regression test in routes/manage/sources/sources.spec.ts deletes the source inside the mocked access check (failed with 500 before, passes now); a unit test covers saveSource on a missing id. Affected specs pass (92 tests).
<!-- SECTION:FINAL_SUMMARY:END -->
