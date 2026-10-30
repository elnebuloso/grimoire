---
id: TASK-104
title: Scope source reads by project and read source credentials in one place
status: To Do
assignee:
  - '@claude'
created_date: '2026-10-30 02:59'
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
- [ ] #1 No admin function reads or updates a source by a bare source ID: each is scoped by project or takes the source already found for the project
- [ ] #2 The credential columns of a source are selected and mapped by one function used by `projects.ts` and `source-access.ts`
- [ ] #3 A test shows that a source of another project is neither read nor changed through these functions
- [ ] #4 Existing admin and sync tests pass
<!-- AC:END -->
