---
id: TASK-327
title: 'Sync: list a directory under its real path, not under the first symlink to it'
status: To Do
assignee: []
created_date: '2026-11-06 22:05'
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
- [ ] #1 A directory reachable by its real path and by a symlink is listed under its real path
- [ ] #2 A symlink to an excluded directory does not make its pages indexed
- [ ] #3 The symlink specs of TASK-307 (outside link, self-links, source path) still pass
- [ ] #4 Specs in `index-source.spec.ts` cover both cases
<!-- AC:END -->
