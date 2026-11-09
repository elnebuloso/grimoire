---
id: TASK-419
title: >-
  Spike: measure the cost of checking out a whole directory for one included
  file
status: To Do
assignee: []
created_date: '2026-11-09 10:17'
updated_date: '2026-11-09 10:20'
labels:
  - sync
dependencies: []
priority: low
type: spike
ordinal: 481000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
### What this is
A source is cloned sparsely: only its source path is checked out. When a page includes a file outside it, or a symlink points outside it, `prepareCheckout` (`app/src/lib/server/sync/index-source.ts`) fetches the target's directory with `addSparseDirectories` (`app/src/lib/server/sync/git.ts`), which runs git's cone mode.

### Problem
Cone-mode directories are recursive. An include of one file, `packages/core/README.md`, checks out all of `packages/core/**`; in a monorepo that can be hundreds of MB, downloaded inside the indexing deadline (`INDEXING_DEADLINE_MINUTES`, default 10). The same happens for an include of a file that does not exist. This is reasoned from git's documented cone-mode behaviour and not measured in grimoire yet.

### Fix
First measure it: a fixture or a real monorepo with an include across directories, comparing time and clone size. If it matters, read single files with `git show HEAD:<path>` (a lazy blob fetch in a partial clone) or a non-cone sparse pattern, instead of checking out the whole directory. This is a spike; decide with the owner before building.

### If we skip it
Slow syncs, or deadline failures, for monorepos whose docs include files from other directories.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Time and clone size are measured for an include across directories in a monorepo-like fixture
- [ ] #2 Findings and a recommendation are in the task notes; nothing is built without the owner's decision
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Commit type for whatever follows the spike: decided with the owner; the spike itself is a chore(backlog) note.
<!-- SECTION:NOTES:END -->
