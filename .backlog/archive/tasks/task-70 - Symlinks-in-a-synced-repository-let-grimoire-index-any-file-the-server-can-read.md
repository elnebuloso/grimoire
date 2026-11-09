---
id: TASK-70
title: >-
  Symlinks in a synced repository let grimoire index any file the server can
  read
status: Done
assignee:
  - '@claude'
created_date: '2026-10-30 00:14'
updated_date: '2026-10-30 00:21'
labels:
  - sync
milestone: m-0
dependencies: []
references:
  - app/src/lib/server/sync/index-source.ts
  - app/src/lib/server/parsing/include.ts
priority: high
type: bug
ordinal: 132000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Found by a code review on 2026-10-30 (read only, not reproduced).

Pages and include targets are read with `readFileSync(join(checkout, path))` in `app/src/lib/server/sync/index-source.ts` (around lines 41 and 97-119, used by include resolution in `app/src/lib/server/parsing/include.ts:138-143`). That follows symlinks. `git clone` on Linux checks symlinks out as symlinks, and nothing in `sync/` or `parsing/` uses `lstat` or `realpath`.

grimoire assumes people and agents write Markdown in Git repositories, so anyone who can push to a synced docs branch is a weaker principal than an admin. Two attacks:

- a page `secrets.md -> /proc/self/environ` exposes `TOKEN_ENCRYPTION_KEY`;
- an include `--8<-- "docs/db.md"` with `db.md -> /data/grimoire.db` exposes the SQLite file (owned by the image user `node`, see `Dockerfile`), which holds every source's encrypted Git token.

Either becomes a snippet every API key holder can `read` or `query`, so one commit leaks the instance key and with it the Git credentials of all other sources.

Review suggestion: guard the single place where checkout files are read (`readFile` in `index-source.ts`) and the page listing (`listPages`): resolve `realpath` and refuse anything outside the checkout, or skip symlinks with a warning.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 A symlinked page pointing outside the checkout is not indexed
- [x] #2 A symlinked include target pointing outside the checkout is not read; the include is treated like a missing file
- [x] #3 Symlinks that stay inside the checkout either keep working or are skipped, and the behaviour is documented in the handbook
- [x] #4 Tests cover a symlinked page and a symlinked include pointing outside the checkout
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Replace readFile in index-source.ts with readInside: resolve realpath and read only when it lies inside the realpath of the checkout. All page, include and site-config reads go through it.
2. Pages that cannot be read that way are skipped with a source warning instead of being indexed empty.
3. Tests for an outside page, an outside include and an inside symlink; handbook row in writing.md.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Symlinks that stay inside the checkout keep working (realpath inside the checkout), documented in docs/handbook/writing.md. The same guard also stops include paths with ../ that leave the checkout, since every checkout read goes through readInside. The two outside tests fail with the old readFile and pass with the fix.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Checkout files are now read only where their real path lies inside the checkout. A committed symlink to /proc/self/environ or the database no longer becomes a snippet: such a page is skipped with a source warning, such an include is treated as missing. Symlinks within the repository still work. Handbook (writing.md) says so. Verified by three new tests in index-source.spec.ts (two fail before the fix), make lint, make test (457 passed) and make handbook.
<!-- SECTION:FINAL_SUMMARY:END -->
