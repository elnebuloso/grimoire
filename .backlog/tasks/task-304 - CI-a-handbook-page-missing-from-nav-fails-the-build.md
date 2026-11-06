---
id: TASK-304
title: 'CI: a handbook page missing from nav fails the build'
status: To Do
assignee: []
created_date: '2026-11-06 19:53'
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
- [ ] #1 make handbook fails, naming the file, when a page in docs/handbook/ is missing from nav
- [ ] #2 make handbook passes on the current handbook
- [ ] #3 memory.md no longer says nav must be checked by hand
<!-- AC:END -->
