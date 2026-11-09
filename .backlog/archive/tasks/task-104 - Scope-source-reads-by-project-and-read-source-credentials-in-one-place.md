---
id: TASK-104
title: Scope source reads by project and read source credentials in one place
status: Done
assignee:
  - '@claude'
created_date: '2026-10-30 02:59'
updated_date: '2026-10-30 03:24'
labels:
  - admin
milestone: m-0
dependencies:
  - TASK-103
references:
  - app/src/lib/server/admin/projects.ts
  - app/src/lib/server/admin/source-access.ts
  - app/src/lib/server/admin/status.ts
  - app/src/lib/server/db/sources.ts
priority: low
type: chore
ordinal: 166000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Found by a code review of the management area on 2026-10-30.

- The credential columns of a source are selected three times, each mapping the row by hand: in `remoteProblem` (`app/src/lib/server/admin/projects.ts`, around lines 287-291), in `storedAccess` (`app/src/lib/server/admin/source-access.ts`, around lines 19-24) and in `sourceForSync` (`app/src/lib/server/db/sources.ts`, around line 78).
- `findSource` and `deleteSource` take `(projectId, sourceId)`. But `remoteProblem`, `storedAccess`, the `UPDATE` in `saveSource` (`projects.ts`, around 359-368) and `sourceStatus` (`app/src/lib/server/admin/status.ts:70`) take a bare `sourceId` and query `WHERE id = ?`.

Today this is safe only because every route calls `pageFor` first, which answers 404 for a source of another project. The module does not hold that line itself: the next caller with an unchecked ID (a JSON endpoint, a script) would read or edit across projects. A change to how credentials are stored (per-host credentials, a token rotation date) has to find all three selects in three files. A single save of an existing source reads the same row up to six times through these paths.

`projects.ts` (about 450 lines: project CRUD, source CRUD and validation, and the route helper `parseIdParam`) would be easier to navigate with sources in their own module; worth doing alongside this, not on its own.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 No admin function reads or updates a source by a bare source ID: each is scoped by project or takes the source already found for the project
- [x] #2 The credential columns of a source are selected and mapped by one function used by `projects.ts` and `source-access.ts`
- [x] #3 A test shows that a source of another project is neither read nor changed through these functions
- [x] #4 Existing admin and sync tests pass
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. One exported `storedAccess(db, projectId, sourceId)` in `projects.ts` selects URL, branch, username and token scoped by project; `remoteProblem` and `source-access.ts` use it.
2. `remoteProblem`, `accessChanged`, `checkSourceAccess` and `sourceStatus` take the project ID; the UPDATEs in `saveSource` and `changeSourceSlug` are scoped by project, and an update of another project's source throws.
3. Regression tests for another project's source in `projects.spec.ts` and `source-access.spec.ts`.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
`sourceForSync` in `db/sources.ts` keeps its own select: the sync worker reads sources by ID only, has no project context, and needs different columns (path, exclusions, last commit). The task scoped the shared function to `projects.ts` and `source-access.ts`. Not done: moving sources out of `projects.ts` into their own module (the task called it optional). The two new tests fail on the old code. make lint, make test (555) and make e2e (17) pass.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Admin source reads and writes are now scoped by project in the module itself, not only by the route's `pageFor` check: `remoteProblem`, `accessChanged`, `checkSourceAccess` and `sourceStatus` take the project ID, and the UPDATEs in `saveSource` and `changeSourceSlug` match on it. The stored URL, branch, username and token of a source are read by a single `storedAccess`. Tests show that another project's source is neither read nor changed. The sync worker's `sourceForSync` is unchanged on purpose.
<!-- SECTION:FINAL_SUMMARY:END -->
