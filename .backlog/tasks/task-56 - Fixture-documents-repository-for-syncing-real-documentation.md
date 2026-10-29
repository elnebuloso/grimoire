---
id: TASK-56
title: Fixture documents repository for syncing real documentation
status: To Do
assignee: []
created_date: '2026-10-29T07:11:00Z'
updated_date: '2026-10-29T07:12:00Z'
labels:
  - ops
dependencies: []
references:
  - docs/handbook/writing.md
  - https://github.com/elnebuloso/grimoire-fixtures-documentations
priority: medium
type: chore
ordinal: 118000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Developers and agents need documentation to sync that exercises what grimoire processes, and states the UI can show, without depending on someone else's repository changing under them. Test projects today point at made-up URLs, so their sources never sync, and every look at a page, a snippet or a dead link starts with typing one in. A repository with documentation built for this purpose gives the agent environment (TASK-55), manual checks and future tests known content with known results.

The repository is `grimoire-fixtures-documentations` on GitHub: https://github.com/elnebuloso/grimoire-fixtures-documentations. Its content follows what `docs/handbook/writing.md` says grimoire understands; when that page gains a feature, the repository gains an example of it.
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
