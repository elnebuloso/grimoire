---
id: TASK-307
title: >-
  Sync: listing pages must not follow symlinked directories out of the checkout
  or in a loop
status: Done
assignee:
  - '@claude'
created_date: '2026-11-06 20:51'
updated_date: '2026-11-06 21:00'
labels:
  - sync
dependencies: []
references:
  - app/src/lib/server/sync/index-source.ts
priority: high
type: bug
ordinal: 369000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
`listPages` in `app/src/lib/server/sync/index-source.ts` lists Markdown files with `readdirSync(join(checkout, sourcePath), { recursive: true })`. Node's recursive `readdirSync` follows symlinked directories (confirmed with Node 24: a link `docs/nested -> ../outside` lists `nested/secret.md`). File contents are safe because `readInside` refuses files outside the checkout (TASK-70), but the listing is not.

Cases, both reachable for anyone who can push to a docs branch:
- `docs/a -> .` and `docs/b -> .`: the walk grows exponentially and did not finish within 15 s. It runs synchronously in the indexing worker until `INDEXING_DEADLINE_MS` (10 minutes, `app/src/lib/server/sync/sync.ts`) or out of memory, holding the single sync slot, so every other source waits – on every new commit.
- `docs/x -> /`: the walk covers the host filesystem; the `.md` paths found there appear in the sync warnings and errors shown to admins ("…: not readable inside the repository").

Suggested fix: replace the recursive readdir with a short manual walk using `withFileTypes`; before descending into a directory (or a symlink to one) resolve it with `realpath` and skip it if it lies outside the checkout root or was already visited. Apply the same check to the source directory itself.

Found by a whole-repo audit on 2026-11-06 (commit 601c588 plus six local refactor commits).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 A symlinked directory pointing outside the checkout is not descended into and its files are not listed
- [x] #2 Two symlinks pointing to their own parent directory do not loop; the listing finishes promptly and still lists the real pages once
- [x] #3 Regular nested directories and `.md` files are listed exactly as before
- [x] #4 Specs in `index-source.spec.ts` cover the outside link and the self-links
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Specs: a directory symlink outside the checkout lists nothing, two links to their own parent list each page once, a source path linking outside is refused
2. listPages walks with withFileTypes, follows a directory (or a link to one) only when its real path is inside the checkout and not yet visited, skips .git; file links stay listed so readInside still warns
3. realInside shared by listPages and readInside
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
- Before the change the self-link spec never finished: the synchronous walk blocked the test worker until it was killed. After: index-source, index-pages, sync-logic (31 tests) and sync.spec.ts (7) pass.
- Entries are sorted per directory so that a directory reachable by two paths is always listed under the same one.
- A directory reached through a link inside the checkout that is also reachable directly is now listed once instead of twice.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Listing the pages of a source no longer uses the recursive readdir, which followed symlinked directories anywhere. The new walk follows a directory only where its real path lies inside the checkout and visits each directory once, so a pushed link to `/` lists nothing outside the repository and links back to a parent no longer stall the sync slot until the deadline. A source path that links outside counts as missing. Three specs cover the outside link, the self-links and the source path; the existing symlink specs still pass.
<!-- SECTION:FINAL_SUMMARY:END -->
