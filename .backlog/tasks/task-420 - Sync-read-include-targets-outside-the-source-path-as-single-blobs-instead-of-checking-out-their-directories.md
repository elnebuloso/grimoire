---
id: TASK-420
title: >-
  Sync: read include targets outside the source path as single blobs instead of
  checking out their directories
status: To Do
assignee: []
created_date: '2026-11-09 11:28'
labels:
  - sync
  - parsing
dependencies:
  - TASK-419
priority: low
type: enhancement
ordinal: 482000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
**Build this only when it is needed:** a source from a monorepo includes files from other directories, or a sync of such a source runs into the indexing deadline (`INDEXING_DEADLINE_MINUTES`) because of its includes. Until then it stays on the board so the finding is not lost.

### What this is
A source is cloned sparsely: only its source path is checked out (`sparseClone` in `app/src/lib/server/sync/git.ts`: `clone --depth 1 --filter=blob:none --sparse`, then `sparse-checkout set`). When a page includes a file outside the source path (`--8<-- "packages/core/README.md"`, resolved by `resolveIncludes` in `app/src/lib/server/parsing/include.ts`), `prepareCheckout` in `app/src/lib/server/sync/index-source.ts` collects the target's directory (`posix.dirname(target)`) and passes it to `fetchDirectories`, which runs `addSparseDirectories` (`sparse-checkout add`). The file is then read from disk with `readInside`, which refuses anything whose real path leaves the checkout.

### Problem
`sparse-checkout add` in cone mode is recursive: the whole directory tree below the target's directory is fetched and written to disk, not just the one file. Measured on 2026-11-09, locally over `file://` (no network), with the same git commands:

| What | Time | Clone on disk |
|---|---|---|
| docs only | 0.09 s | 460 KB |
| + `sparse-checkout add packages/core` (today, for one 40-byte include) | 6.02 s | 391 MB |
| + `git show HEAD:packages/core/README.md` (one blob, fetched lazily) | 0.23 s | 472 KB |

The fixture had 20 × 10 MB incompressible assets and 2000 small files below `packages/core`. Over a network the 200 MB transfer dominates (about 30 s at 50 Mbit/s) and counts against the indexing deadline; a monorepo with gigabytes below the included directory can fail the sync. An include of a missing file costs the same, because its directory is fetched before the file is found missing.

### Fix
Read include targets outside the source path as single blobs instead of checking out their directories:
- In the indexing child process, read such a target with `git cat-file -p HEAD:<path>` (or `git show`), run in the checkout with the same remote connection `addSparseDirectories` uses (`connect(remote)` in `git.ts`), so the partial clone fetches just that blob. Keep the token handling and SSRF protection of `connect`/`git` unchanged.
- Hand that reader to `resolveIncludes` for targets outside the source path, in place of the directory fetch in the include loop of `prepareCheckout` (`fetchDirectories([...missing])` around `index-source.ts:143`).
- Keep `fetchLinkTargets` and `addSparseDirectories` for symlinked directories in the source path: those need a real tree on disk.

Tests: `app/src/lib/server/sync/sync.spec.ts` (real git over `file://`; its template repository already has `shared/warning.md` included from `docs/deploy.md`) for "an include outside the source path does not check out its directory" (assert the sibling files of the target are not on disk) and for a missing include target. `app/src/lib/server/sync/index-source.spec.ts` for the reader seam. Run `make benchmark`: sync changed.

### If we skip it
Sources whose docs include files from large directories sync slowly or hit the indexing deadline; the admin sees a deadline error without an obvious cause.

### Notes for the implementer
- **Security trap:** `readInside` exists so that a docs branch cannot include a symlink to `/proc/self/environ` or the database. A blob read never touches the disk, so that risk disappears, but a symlink in the Git tree comes back as its link text, not the target's content. Resolve symlinks inside the Git tree (`git cat-file -t` / mode `120000`, then follow the link relative to its directory, refusing `..` past the repository root and absolute targets), or refuse symlinked include targets with a warning; never fall back to reading the disk.
- `IndexJob` changes only if the reader needs data the child does not have yet; if a field is added, add it to `scripts/image-smoke.sh` and run `make image && make image-smoke` before the push.
- Commit type: `fix` (released behaviour: syncs get faster and stop failing), so pushing it cuts a release; write the release-notes summary per `.claude/rules/release-notes.md` afterwards.
- The measurement and its script are in TASK-419 (archived by then; `backlog task view TASK-419 --plain` still reads it).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 An include of one file outside the source path fetches only that file, not its directory tree
- [ ] #2 A missing include target outside the source path fetches nothing and keeps its 'not found' warning
- [ ] #3 Symlinked include targets are resolved inside the Git tree or refused with a warning; nothing outside the repository is read
- [ ] #4 Symlinked directories in the source path are still checked out as today
- [ ] #5 sync.spec.ts covers the cases; make benchmark shows no unintended difference
<!-- AC:END -->
