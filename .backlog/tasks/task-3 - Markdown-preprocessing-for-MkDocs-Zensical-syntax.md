---
id: TASK-3
title: Markdown preprocessing for MkDocs/Zensical syntax
status: To Do
assignee: []
created_date: '2026-10-28T19:31:00Z'
labels:
  - parsing
milestone: m-0
dependencies:
  - TASK-1
documentation:
  - docs/konzept.md
priority: high
type: feature
ordinal: 3000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Docs are written for MkDocs/Zensical and use extensions that plain Markdown parsers do not understand. Agents must receive the content in plain Markdown, without losing warnings or tab contents, and without noise like image URLs or HTML comments.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Frontmatter is parsed into title, description and tags and removed from the text
- [ ] #2 Admonitions (`!!! warning "Achtung"`) become `> **Achtung:** …` with their content kept
- [ ] #3 Content tabs (`=== "Linux"`) become `**Linux:**` with their content kept
- [ ] #4 Images keep their alt text, the URL is dropped
- [ ] #5 HTML comments are removed; Mermaid blocks stay code blocks
- [ ] #6 Unit tests cover each element with a sample page
<!-- AC:END -->
