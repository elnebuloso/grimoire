---
id: TASK-307
title: >-
  Sync: listing pages must not follow symlinked directories out of the checkout
  or in a loop
status: To Do
assignee: []
created_date: '2026-11-06 20:51'
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
- [ ] #1 A symlinked directory pointing outside the checkout is not descended into and its files are not listed
- [ ] #2 Two symlinks pointing to their own parent directory do not loop; the listing finishes promptly and still lists the real pages once
- [ ] #3 Regular nested directories and `.md` files are listed exactly as before
- [ ] #4 Specs in `index-source.spec.ts` cover the outside link and the self-links
<!-- AC:END -->
