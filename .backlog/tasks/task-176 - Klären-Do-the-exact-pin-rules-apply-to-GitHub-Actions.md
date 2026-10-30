---
id: TASK-176
title: Pin every GitHub Action to an exact version
status: To Do
assignee: []
created_date: '2026-10-30 16:13'
updated_date: '2026-10-30 16:16'
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
- [ ] #1 Every action in `.github/workflows/` is pinned to an exact version tag that is at least two weeks old
- [ ] #2 `.claude/rules/memory.md` names GitHub Actions among what is pinned exactly
<!-- AC:END -->
