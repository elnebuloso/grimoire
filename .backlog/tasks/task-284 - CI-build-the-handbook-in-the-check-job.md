---
id: TASK-284
title: 'CI: build the handbook in the check job'
status: To Do
assignee: []
created_date: '2026-11-06 15:58'
labels:
  - ops
dependencies: []
priority: medium
type: chore
ordinal: 346000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
`make handbook` builds with `--strict`, so a page missing from `nav` in `zensical.toml` fails. The `check` job in `.github/workflows/ci.yml` does not run it; `handbook.yml` is called only after `release` has tagged a version (`if: needs.release.outputs.released`). A pull request that breaks the handbook passes and is merged; the Pages deploy fails only after the next release, and the published handbook stays one release behind the image. A `docs:` merge releases nothing, so the failure waits silently.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 The `check` job runs `make handbook` (with `astral-sh/setup-uv` pinned as in `handbook.yml`) and fails on a strict-build error
<!-- AC:END -->
