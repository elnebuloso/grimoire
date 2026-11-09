---
id: TASK-419
title: >-
  Spike: measure the cost of checking out a whole directory for one included
  file
status: Done
assignee:
  - '@claude'
created_date: '2026-11-09 10:17'
updated_date: '2026-11-09 11:00'
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
- [x] #1 Time and clone size are measured for an include across directories in a monorepo-like fixture
- [x] #2 Findings and a recommendation are in the task notes; nothing is built without the owner's decision
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Commit type for whatever follows the spike: decided with the owner; the spike itself is a chore(backlog) note.

Measured on 2026-11-09, locally over file:// (no network), with the same git commands as sparseClone/addSparseDirectories (clone --depth 1 --filter=blob:none --sparse, sparse-checkout set/add --skip-checks):

Fixture: docs/index.md includes packages/core/README.md (40 bytes); packages/core also holds 20 x 10 MB incompressible assets and 2000 small .ts files.

| What | Time | Clone on disk |
|---|---|---|
| docs only | 0.09 s | 460 KB |
| + sparse-checkout add packages/core (today's include path) | 6.02 s | 391 MB |
| + git show HEAD:packages/core/README.md (one blob, lazy fetch) | 0.23 s | 472 KB |

Confirmed: an include of one file checks out its whole directory tree (blobs fetched and written to the worktree, about twice the 200 MB). Over a network the 200 MB transfer dominates (e.g. ~30 s at 50 Mbit/s) and counts against INDEXING_DEADLINE_MINUTES; a monorepo with GBs below the included directory could hit the deadline. An include of a missing file costs the same, since its directory is fetched first.

Recommendation (not built, owner decides): read include targets outside the source path as single blobs (git show / cat-file HEAD:<path>, lazily fetched in the partial clone) instead of adding their directories to the sparse checkout. Keep addSparseDirectories for symlinked directories (fetchLinkTargets), which need a real tree. Trade-off: a second read path next to readInside, and symlinks among include targets must be resolved in the Git tree rather than on disk; worth it only if monorepo sources with cross-directory includes are expected. Cheaper interim option: none that keeps includes working.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Measured: an include of one 40-byte file outside the source path made the sparse clone grow from 460 KB to 391 MB and take 6 s locally, because cone mode checks out the whole directory; a single-blob read (git show HEAD:<path>) cost 0.23 s and 12 KB. Recommendation in the notes: read include targets as single blobs, keep directory checkout for symlinked directories. Nothing built; the owner decides whether to make it a task.
<!-- SECTION:FINAL_SUMMARY:END -->
