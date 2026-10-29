---
id: TASK-42
title: Order the project index by the site navigation
status: To Do
assignee: []
created_date: '2026-10-29T00:47:00Z'
labels:
  - parsing
milestone: m-1
dependencies: []
priority: low
type: enhancement
ordinal: 104000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The concept says `index` lists pages "from nav or the file tree". Version 1 orders by the file tree only; `nav` from `mkdocs.yml` or `zensical.toml` is not read, so the index can differ from the order readers see on the site.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 `index` follows `nav` from `mkdocs.yml` or `zensical.toml` when the source has one
- [ ] #2 Pages missing from `nav` are still listed, after the ones in it
- [ ] #3 Without a site config, the file tree order stays
<!-- AC:END -->
