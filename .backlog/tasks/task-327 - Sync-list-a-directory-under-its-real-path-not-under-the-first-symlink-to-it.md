---
id: TASK-327
title: 'Sync: list a directory under its real path, not under the first symlink to it'
status: Done
assignee:
  - '@claude'
created_date: '2026-11-06 22:05'
updated_date: '2026-11-06 22:16'
labels:
  - sync
dependencies: []
references:
  - app/src/lib/server/sync/index-source.ts
priority: high
type: bug
ordinal: 389000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Since TASK-307, `listPages` in `app/src/lib/server/sync/index-source.ts` walks the source with `readdirSync(..., { withFileTypes: true })`, sorted by name, follows a symlinked directory only inside the checkout, and visits each real directory once (a `visited` set of real paths). The first name under which a directory is reached claims it – and a symlink can sort before the real directory.

Cases (shown with a scratch copy of the walk):
- `docs/guide/a.md` is a real file and `docs/current -> guide` a symlink. The old recursive readdir listed `current/a.md` and `guide/a.md`; the new walk lists only `current/a.md`. The page ID `guide/a` disappears, a link from `index.md` to `guide/a.md` becomes a dead link, and a nav entry for `guide/a.md` loses its position.
- With the exclusion `docs/internal/**` and a symlink `docs/a-internal -> internal`, `a-internal/secret.md` is indexed and `internal/` is skipped: whether an exclusion holds depends on how a link is named.

Suggested fix: walk real directories first and follow symlinked directories only after the walk of real ones is done (e.g. queue symlinked directories and walk them afterwards), so the real path always claims a directory and the exclusion of a real directory also covers the link to it – decide whether a symlinked directory whose real path is excluded is skipped (recommended).

Found by the second whole-repo audit on 2026-11-06 (HEAD 06aada8).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 A directory reachable by its real path and by a symlink is listed under its real path
- [x] #2 A symlink to an excluded directory does not make its pages indexed
- [x] #3 The symlink specs of TASK-307 (outside link, self-links, source path) still pass
- [x] #4 Specs in `index-source.spec.ts` cover both cases
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Specs: docs/current -> guide lists guide/a.md only; a link to an excluded directory (inside and outside the source path) indexes nothing of it; a link to a directory outside the source path but inside the checkout is still followed
2. listPages walks real directories first and queues symlinked directories, walked afterwards when their real path was not visited
3. A page is excluded when either its listed path or its real repository path matches an exclusion
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
- The two new failing specs failed before and pass after; the TASK-307 symlink specs still pass; index-source.spec.ts and sync.spec.ts pass (27 tests).
- Real directories are checked against `visited` as well: a subdirectory reached through one link must not be listed again through another.
- Recommended in the task and done: a link to an excluded directory is skipped, because its pages are excluded by their real path.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
The page listing walks the real directories of a source first and follows symlinked directories only afterwards, so a directory is always listed under its real path, whatever a link to it is named; page IDs and links to them no longer depend on symlink names. A page is excluded when its listed or its real repository path matches an exclusion, so a link cannot bring an excluded directory back. Specs cover the link that sorts first, links to excluded directories inside and outside the source path, and a link to a directory outside the source path.
<!-- SECTION:FINAL_SUMMARY:END -->
