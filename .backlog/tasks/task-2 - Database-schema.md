---
id: TASK-2
title: Database schema
status: To Do
assignee: []
created_date: '2026-10-28T19:31:00Z'
updated_date: '2026-10-28T20:07:00Z'
labels:
  - search
milestone: m-0
dependencies:
  - TASK-1
documentation:
  - docs/konzept.md
priority: high
type: feature
ordinal: 2000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
All data lives in one SQLite file: projects, their sources, the pages and snippets read from Git, links between pages, and API keys. Snippets are searched with FTS5 BM25 weighted per column (title path strong, text normal, code weak), so the index needs those columns separately. IDs are `<project>/<source>/<file without .md>#<anchor>`, so the source slug must be unique within its project.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 The SQLite file path is configurable via an environment variable; the schema is created on first start
- [ ] #2 Tables exist for projects, sources, pages, snippets, links and API keys as described in the data model of `docs/konzept.md`
- [ ] #3 Snippets are indexed in an FTS5 table with separate columns for title path, text and code
- [ ] #4 A second source with the same slug in the same project is rejected by the database; the same slug in another project is allowed
- [ ] #5 Deleting a source removes its pages, snippets and links
- [ ] #6 Backlinks of a page can be queried from the links table
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Handoff from TASK-5: parts of a split section (`Heading (1/2)`, `(2/2)`) share the same anchor, and the overview snippet has none – (page, anchor) is not a unique key for snippets.

AC "Backlinks of a page can be queried" moved here from TASK-6, which only produces the link records (decided with the user).
<!-- SECTION:NOTES:END -->
