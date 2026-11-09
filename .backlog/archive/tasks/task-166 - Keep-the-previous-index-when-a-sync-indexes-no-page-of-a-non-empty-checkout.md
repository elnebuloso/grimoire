---
id: TASK-166
title: Keep the previous index when a sync indexes no page of a non-empty checkout
status: Done
assignee:
  - '@claude'
created_date: '2026-10-30 16:13'
updated_date: '2026-10-30 16:23'
labels:
  - sync
  - parsing
milestone: m-0
dependencies: []
priority: high
type: bug
ordinal: 228000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
`indexPages` (`app/src/lib/server/sync/index-pages.ts`) skips a page that throws and keeps a warning, which is right for one broken page. An error that hits every page, such as a bad site config option, skips all of them; `replaceSourceIndex` (`app/src/lib/server/db/sources.ts`) then swaps the empty result in as the live index and the sync ends as `synced`. Agents and public visitors find nothing in the source any more, the previous index is gone, and the only sign is a warning on the source page. `syncSource` promises that on failure the previous index stays active. Reproduced by calling `indexPages`: `pymdownx.slugs.slugify` with `normalize: nfc` (lowercase) in `mkdocs.yml` reaches `String.prototype.normalize`, which throws a `RangeError`; two pages went in, zero came out, with two identical warnings. `configuredSlugify` (`app/src/lib/server/parsing/slugs.ts`) falls back to the default with a warning for an unknown slug function, but not for an unknown option. A parser regression after a dependency update would have the same effect.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 A sync whose checkout has pages but indexes none fails, keeps the previous index and shows an error on the source
- [x] #2 An invalid `normalize` or `case` option of the slug function falls back to the default with a warning, as an unknown slug function does
- [x] #3 A sync test with a site config that breaks every page checks that the previous index stays live
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. `indexPages` throws when the checkout had pages but none could be processed; the sync fails through the existing error path and the previous index stays
2. `configuredSlugify` falls back with a warning for an unknown `normalize` or `case` of `pymdownx.slugs.slugify`
3. Tests: slug option fallback, sync whose new commit has only broken pages
4. Handbook: error row in admin.md, warnings intro and toc row in writing.md
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
AC #3: after the `normalize` fix a site config no longer breaks every page, so the sync test uses the other realistic trigger: a commit that leaves only pages with broken front matter (the fixture page `docs/broken.md`). Same path through `indexPages`, the worker and `syncSource`.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
A sync whose checkout has pages but indexes none now fails with `no page could be indexed, <last skip warning>`; the previous index stays live and the error shows on the source. `pymdownx.slugs.slugify` with an unknown `normalize` or `case` falls back to the default slug function with a warning instead of throwing on every heading. Handbook: new error row in `admin.md`, `writing.md` says that skipping every page fails the sync. Verified: new slug and sync tests fail without the change and pass with it; sync, db, agent and parsing tests green; `make handbook` strict.
<!-- SECTION:FINAL_SUMMARY:END -->
