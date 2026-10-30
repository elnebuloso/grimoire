---
id: TASK-176
title: 'Klären: Do the exact-pin rules apply to GitHub Actions?'
status: To Do
assignee: []
created_date: '2026-10-30 16:13'
labels:
  - ops
milestone: m-0
dependencies: []
priority: low
type: spike
ordinal: 238000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
`.claude/rules/memory.md` asks for exact versions of dependencies, base images and images in examples. The workflows `.github/workflows/ci.yml` and `handbook.yml` use floating major tags (`actions/checkout@v7`, `actions/setup-node@v7`, `actions/upload-pages-artifact@v5`, `actions/deploy-pages@v5`), while `setup-uv@v10.3.0` is pinned exactly. Whether actions count as dependencies under that rule is open; the user decides.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 The user has decided whether GitHub Actions are pinned exactly
- [ ] #2 Either every action in `.github/workflows/` is pinned to an exact version or commit, or `.claude/rules/memory.md` states that actions are exempt
<!-- AC:END -->
