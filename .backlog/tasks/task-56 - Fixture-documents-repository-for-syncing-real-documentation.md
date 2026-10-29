---
id: TASK-56
title: Fixture documents repository for syncing real documentation
status: In Progress
assignee:
  - '@claude'
created_date: '2026-10-29T07:11:00Z'
updated_date: '2026-10-29 17:59'
labels:
  - ops
milestone: m-0
dependencies: []
references:
  - docs/handbook/writing.md
  - 'https://github.com/elnebuloso/grimoire-fixture-docs'
priority: medium
type: chore
ordinal: 118000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Developers and agents need documentation to sync that exercises what grimoire processes, and states the UI can show, without depending on someone else's repository changing under them. Test projects today point at made-up URLs, so their sources never sync, and every look at a page, a snippet or a dead link starts with typing one in. A repository with documentation built for this purpose gives the agent environment (TASK-55), manual checks and future tests known content with known results.

The repository is `grimoire-fixture-docs` on GitHub: https://github.com/elnebuloso/grimoire-fixture-docs. Its content follows what `docs/handbook/writing.md` says grimoire understands; when that page gains a feature, the repository gains an example of it.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 The repository is reachable over `https` without credentials, so a source can sync it with no token
- [ ] #2 It holds several documentation sites in separate paths, so one repository serves several sources, at least one configured with `zensical.toml` and one with `mkdocs.yml`
- [ ] #3 Every element in the tables of `docs/handbook/writing.md` appears at least once: front matter, admonitions, content tabs, `nav` (with a page missing from it), `toc` `slugify` and `separator`, whole and partial includes (lines and named sections, one from outside the source path), Mermaid, images and HTML comments
- [ ] #4 It contains the cases of page splitting: a page with only an overview, a section short enough to be merged, and one long enough to be cut into parts
- [ ] #5 It contains working relative links with and without anchor, reference-style links, and dead links: to a missing page, to a missing anchor, and leaving the source path
- [ ] #6 A README in the repository lists for each path what it demonstrates and what grimoire is expected to produce from it (pages, notable snippet IDs, dead links), so a deviation is visible at a glance
- [ ] #7 Synced into grimoire, every site indexes without errors other than the documented dead links
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Layout: shared/ (include targets outside every source path), zensical/ (zensical.toml + docs/, source path zensical/docs), mkdocs/ (mkdocs.yml + docs/, source path mkdocs/docs).
2. Cover every element of the tables in docs/handbook/writing.md across both sites: front matter, admonitions, content tabs, nav with one page missing, toc slugify and separator, whole and partial includes (lines, named section, from shared/), Mermaid, images, HTML comments.
3. Cover page splitting (overview-only page, section merged into its parent, section split into parts) and links (relative with and without anchor, reference-style, dead: missing page, missing anchor, leaving the source path).
4. README lists per path the source settings, pages in index order, notable snippet IDs and the dead links.
5. Verify locally: sync both paths from a file:// URL into a scratch database and compare error, warnings, pages, snippet IDs and links with the README.
6. After the user pushes: sync both paths over https without a token and confirm no error and no warnings.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
The repository exists with an initial commit (`LICENSE`, `README.md`); the local clone sits next to this project at `../grimoire-fixture-docs`, and work on the fixtures is committed there, not here.

Fixture content committed locally in ../grimoire-fixture-docs (cdc6230, 97eb816, afca9f0, 7c9a748), not pushed yet.

Checked before the push: a scratch server (built with make build, own DATABASE_PATH, port 4317) synced both source paths from a file:// URL to the local clone. Result for zensical/docs and mkdocs/docs: error NULL, warnings [], pages, snippet anchors, merged alias who_decides, split parts (1/2)/(2/2) of rolling_back_step_by_step and three dead links per site exactly as listed in the fixture README. Snippet contents checked: includes (whole, lines 3:5, named section main, from inside the source path), tabs, admonitions, Mermaid, image alt text, dropped HTML comments, copied reference definition.

Open: AC #1 and the https part of AC #7 need the push; then sync both paths over https without a token.
<!-- SECTION:NOTES:END -->
