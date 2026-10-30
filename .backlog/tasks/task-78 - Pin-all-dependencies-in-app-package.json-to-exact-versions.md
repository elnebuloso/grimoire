---
id: TASK-78
title: Pin all dependencies in app/package.json to exact versions
status: To Do
assignee:
  - '@claude'
created_date: '2026-10-30 00:14'
labels:
  - ops
milestone: m-0
dependencies: []
references:
  - app/package.json
priority: medium
type: chore
ordinal: 140000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Found by a code review on 2026-10-30.

`.claude/rules/memory.md` requires exact versions (and `.claude/rules/svelte-kit.md` repeats it for what the CLI adds), but `app/package.json` has 24 `^` ranges, among them runtime dependencies (`remark-parse`, `unified`, `yaml`, `remark-gfm`, `unist-util-visit`) and `@sveltejs/kit` and `@sveltejs/adapter-node`. The lockfile keeps builds reproducible today, but the next `npm install <x>` or lockfile refresh can move any of them past the two-week age check the rule exists for.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Every dependency in `app/package.json` is an exact version equal to the one in `app/package-lock.json`
- [ ] #2 `npm ci`, `make test` and `make build` pass
<!-- AC:END -->
