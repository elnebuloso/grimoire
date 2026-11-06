---
id: TASK-304
title: 'CI: a handbook page missing from nav fails the build'
status: Done
assignee:
  - '@claude'
created_date: '2026-11-06 19:53'
updated_date: '2026-11-06 20:01'
labels:
  - ops
dependencies: []
priority: low
type: chore
ordinal: 366000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
`make handbook` runs `zensical build --strict`, which fails on broken links but not on a page in `docs/handbook/` that is missing from `nav` in `zensical.toml` (zensical 0.0.70, checked on 2026-11-06). Such a page is built but cannot be reached through the navigation. Add a small check, a script under `scripts/` run by `make handbook`, that compares the Markdown files in `docs/handbook/` with the entries of `nav` and fails naming the missing ones; CI runs it through the existing `make handbook` step of the check job.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 make handbook fails, naming the file, when a page in docs/handbook/ is missing from nav
- [x] #2 make handbook passes on the current handbook
- [x] #3 memory.md no longer says nav must be checked by hand
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. scripts/check-handbook-nav.py reads zensical.toml with tomllib and names every Markdown page under docs_dir missing from nav, sections included
2. make handbook runs it before the strict build (uv run --python 3.12, as the build); CI's check job and the Pages workflow already run make handbook with uv set up
3. memory.md: no more checking nav by hand
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
- Python rather than a Node script: uv is already there for the build, and tomllib reads the TOML without a dependency.
- Checked: the current handbook passes; an orphan page fails with 'Not in nav in zensical.toml: orphan-check.md' (removed again).
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
make handbook now fails, naming the file, when a page in docs/handbook/ is missing from nav, through scripts/check-handbook-nav.py before the strict build; CI runs it through the existing make handbook steps. Checked with the current handbook and an orphan page; memory.md updated.
<!-- SECTION:FINAL_SUMMARY:END -->
