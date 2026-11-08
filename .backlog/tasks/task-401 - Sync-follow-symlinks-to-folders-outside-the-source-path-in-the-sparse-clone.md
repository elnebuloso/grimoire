---
id: TASK-401
title: 'Sync: follow symlinks to folders outside the source path in the sparse clone'
status: To Do
assignee: []
created_date: '2026-11-08 19:51'
labels:
  - sync
dependencies: []
priority: medium
type: bug
ordinal: 463000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Found by the audit of 2026-11-08 (three independent reviewers, the severe findings re-checked by reading). The handbook promises "Symlinks | Followed while they point inside the repository." (`docs/handbook/writing.md`, around line 67). The sync makes a sparse clone of only the source path (`sparseClone` in `app/src/lib/server/sync/git.ts`), so a target outside it is not on disk. `listPages` / `readInside` in `app/src/lib/server/sync/index-source.ts` (around lines 247-322) then: drop a directory link such as `docs/shared -> ../shared` silently (no pages, no warning); warn "not readable inside the repository, skipped" for a file link `docs/x.md -> ../shared/x.md`, which the handbook (`writing.md`, around line 91) explains as a link leaving the repository, wrong here; fail a source path that is itself a link (`docs -> site/docs`) as "path does not exist", a repeating error that blocks the commit. Reproduced by a reviewer with git 2.43 and local clones; the specs (`index-source.spec.ts` around lines 270-292) write into a full directory and do not notice. Fix shape: in `prepareCheckout`, find link targets inside the repository but outside the source path and hand their folders to the same sparse fetch includes already use (`fetchDirectories`). The checks that a link stays inside the checkout and each directory is walked once must stay.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 With real Git (`sync.spec.ts`), a directory link and a file link from the source path to a folder elsewhere in the repository index their pages
- [ ] #2 A source path that is itself a link inside the repository syncs
- [ ] #3 A link leaving the repository is still not followed, and the warning texts and `docs/handbook/writing.md` match what happens
<!-- AC:END -->
