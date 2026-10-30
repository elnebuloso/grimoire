---
id: TASK-166
title: Keep the previous index when a sync indexes no page of a non-empty checkout
status: To Do
assignee: []
created_date: '2026-10-30 16:13'
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
- [ ] #1 A sync whose checkout has pages but indexes none fails, keeps the previous index and shows an error on the source
- [ ] #2 An invalid `normalize` or `case` option of the slug function falls back to the default with a warning, as an unknown slug function does
- [ ] #3 A sync test with a site config that breaks every page checks that the previous index stays live
<!-- AC:END -->
