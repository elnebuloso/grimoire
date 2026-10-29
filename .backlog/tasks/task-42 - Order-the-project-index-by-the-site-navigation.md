---
id: TASK-42
title: Order the project index by the site navigation
status: Done
assignee:
  - '@claude'
created_date: '2026-10-29T00:47:00Z'
updated_date: '2026-10-29T01:30:00Z'
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
- [x] #1 `index` follows `nav` from `mkdocs.yml` or `zensical.toml` when the source has one
- [x] #2 Pages missing from `nav` are still listed, after the ones in it
- [x] #3 Without a site config, the file tree order stays
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. `parsing/site-config.ts`: find `zensical.toml` (preferred) or `mkdocs.yml` from the source path upwards, parse it (`smol-toml`, `yaml`), flatten `nav` to paths relative to the source via `docs_dir`
2. Store the position in a new column `pages.nav_position` (migration `0005`)
3. Order `index` and `llms.txt` by nav position, then by file
4. Unit tests for the reader, index order in `operations.spec.ts`, a sync test with a root `mkdocs.yml`
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Implemented as planned. Decisions: `zensical.toml` wins when both files exist (Zensical's own file; MkDocs never reads it); `llms.txt` uses the same order as `index`; a config that cannot be parsed is a warning on the source and falls back to the path order. Sparse clones contain the root and parent-directory files (cone mode), confirmed by the sync test. New dependency `smol-toml` 1.9.1 (released 2026-10-09, no dependencies), pinned.

A source indexed before the change keeps the path order until its next sync with a new commit or "Sync now".

`make lint`, `make test` (266), `make e2e`, `make handbook` pass.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
`index` (and `llms.txt`) follow `nav` from `zensical.toml` or `mkdocs.yml`, found in the source path or a directory above it and resolved against `docs_dir`. Pages missing from `nav` follow by path; without a site config the path order stays. Positions are stored per page in `pages.nav_position` (migration `0005`). The site config reader in `parsing/site-config.ts` is ready for TASK-21. Handbook: row in `docs/handbook/writing.md`.
<!-- SECTION:FINAL_SUMMARY:END -->
