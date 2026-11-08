---
id: TASK-401
title: 'Sync: follow symlinks to folders outside the source path in the sparse clone'
status: Done
assignee:
  - '@claude'
created_date: '2026-11-08 19:51'
updated_date: '2026-11-08 20:33'
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
- [x] #1 With real Git (`sync.spec.ts`), a directory link and a file link from the source path to a folder elsewhere in the repository index their pages
- [x] #2 A source path that is itself a link inside the repository syncs
- [x] #3 A link leaving the repository is still not followed, and the warning texts and `docs/handbook/writing.md` match what happens
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
prepareCheckout first walks the source path for symlinks whose relative target lies inside the repository but is not on disk, and checks those out with fetchDirectories (sparse-checkout add), round by round for links in fetched directories; a target ending in .md fetches its directory. Absolute targets and targets above the root are never fetched; reading still goes through readInside, so a link leaving the checkout stays refused. Skipped for a whole-repository source. Spec in sync.spec.ts with real Git: a directory link and a file link to ops/, and a source path that is itself a link (site -> handbook); fails without the change, passes with it. Sync specs: 184 passed. writing.md warning row also names a target the branch lacks.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Symlinks from the source path to elsewhere in the repository now work in the sparse clone: their targets are checked out before pages are listed, and a source path that is itself a link syncs. Links leaving the repository stay refused. Spec with real Git added.
<!-- SECTION:FINAL_SUMMARY:END -->
