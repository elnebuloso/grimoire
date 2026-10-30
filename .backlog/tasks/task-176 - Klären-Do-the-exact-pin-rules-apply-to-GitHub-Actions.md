---
id: TASK-176
title: Pin every GitHub Action to an exact version
status: Done
assignee:
  - '@claude'
created_date: '2026-10-30 16:13'
updated_date: '2026-10-30 16:47'
labels:
  - ops
milestone: m-0
dependencies: []
priority: low
type: chore
ordinal: 238000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
`.claude/rules/memory.md` asks for exact versions of dependencies, base images and images in examples, at least two weeks old. The workflows `.github/workflows/ci.yml` and `handbook.yml` use floating major tags (`actions/checkout@v7`, `actions/setup-node@v7`, `actions/upload-pages-artifact@v5`, `actions/deploy-pages@v5`), so a new action release reaches CI unreviewed; `setup-uv@v10.3.0` is already pinned exactly. The user decided that actions fall under the rule and are pinned to exact version tags, not commit SHAs.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Every action in `.github/workflows/` is pinned to an exact version tag that is at least two weeks old
- [x] #2 `.claude/rules/memory.md` names GitHub Actions among what is pinned exactly
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Pin every `uses:` in `.github/workflows/` to the newest release tag published before 2026-10-16 (two weeks before today), checked with `gh api`
2. Name GitHub Actions in the dependency rule of `.claude/rules/memory.md`
<!-- SECTION:PLAN:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Every action is pinned to an exact release tag at least two weeks old: `actions/checkout@v7.0.1` (2026-07-20), `actions/setup-node@v7.1.0` (2026-10-08), `actions/upload-pages-artifact@v5.0.0` (2026-04-10), `actions/deploy-pages@v5.0.1` (2026-09-01); `astral-sh/setup-uv@v10.3.0` was pinned already. `.claude/rules/memory.md` now names GitHub Actions in the pinning rule. Verified: release dates and tag refs via `gh api`; workflows parse as YAML; not yet run on GitHub.
<!-- SECTION:FINAL_SUMMARY:END -->
