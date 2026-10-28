---
id: TASK-21
title: Support custom `toc.slugify` from site config
status: To Do
assignee: []
created_date: '2026-10-28T19:57:00Z'
labels:
  - parsing
milestone: m-1
dependencies:
  - TASK-5
  - TASK-7
documentation:
  - docs/konzept.md
priority: low
type: enhancement
ordinal: 21000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Version 1 builds anchors like Python-Markdown's default `toc` slugify, which MkDocs and Zensical both use. A site can swap the slug function via `toc.slugify` in `mkdocs.yml` or `zensical.toml` (typically `pymdownx.slugs.slugify` with options such as `case`); its rendered anchors then differ from grimoire's IDs, and links between the two no longer match.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 The sync reads `toc.slugify` from `mkdocs.yml` or `zensical.toml` of the repository when present
- [ ] #2 `pymdownx.slugs.slugify` and its options are supported; anchors match the rendered site
- [ ] #3 An unknown slug function falls back to the default and is reported as a warning on the source
- [ ] #4 Tests compare against anchors produced by the configured slug function
<!-- AC:END -->
